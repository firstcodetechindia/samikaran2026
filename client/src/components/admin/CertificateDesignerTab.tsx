import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award, Crown, Medal, Star, Users, CheckCircle, Trophy,
  Loader2, ChevronRight, FileDown, Printer, X, AlertCircle
} from "lucide-react";
import { FullCertificatePreview, CERTIFICATE_TYPES, CertStudentData } from "@/components/CertificatePreviewSection";

const CERT_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  gold:          { dot: "bg-yellow-500",  bg: "bg-yellow-50",  text: "text-yellow-800" },
  silver:        { dot: "bg-gray-400",    bg: "bg-gray-50",    text: "text-gray-700"   },
  bronze:        { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-800" },
  participation: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800" },
};

function certTypeToDesignKey(certType: string): string {
  if (certType === "merit_gold")   return "gold";
  if (certType === "merit_silver") return "silver";
  if (certType === "merit_bronze") return "bronze";
  return "participation";
}

interface BulkCertRow {
  certType: string;
  verificationCode: string | null;
  rank: number | null;
  score: number | null;
  issuedAt: string;
  studentName: string;
  schoolName: string;
  gradeLevel: string;
  olympiadName: string;
}

function BulkPdfModal({
  open,
  onClose,
  examId,
  examTitle,
  signatories,
}: {
  open: boolean;
  onClose: () => void;
  examId: number;
  examTitle: string;
  signatories: { s1Name: string; s1Title: string; s2Name: string; s2Title: string };
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: rows = [], isLoading, error } = useQuery<BulkCertRow[]>({
    queryKey: ["/api/certificates/bulk-data", examId],
    queryFn: () => fetch(`/api/certificates/bulk-data/${examId}`).then(r => r.json()),
    enabled: open && !!examId,
  });

  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "__bulk-cert-print-style";
    style.innerHTML = `
      @media print {
        body > *:not(#__bulk-cert-print-root) { display: none !important; }
        #__bulk-cert-print-root { display: block !important; }
        .bulk-cert-page { page-break-after: always; break-after: page; padding: 8mm; box-sizing: border-box; }
        .bulk-cert-page:last-child { page-break-after: avoid; break-after: avoid; }
        @page { size: A4 landscape; margin: 0; }
      }
    `;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = "__bulk-cert-print-root";
    root.style.cssText = "display:none;position:fixed;inset:0;z-index:99999;background:white;overflow:auto;";
    if (printRef.current) {
      root.innerHTML = printRef.current.innerHTML;
    }
    document.body.appendChild(root);

    window.print();

    setTimeout(() => {
      document.body.removeChild(root);
      document.head.removeChild(style);
    }, 1000);
  };

  const typeGroups = {
    gold: rows.filter(r => r.certType === "merit_gold"),
    silver: rows.filter(r => r.certType === "merit_silver"),
    bronze: rows.filter(r => r.certType === "merit_bronze"),
    participation: rows.filter(r => r.certType === "participation"),
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                <FileDown className="w-5 h-5 text-violet-600" />
                Bulk PDF — {examTitle}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading ? "Loading..." : `${rows.length} certificates ready to print`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {rows.length > 0 && (
                <Button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white gap-2"
                  data-testid="button-print-all-certs"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Fetching certificate data...
            </div>
          )}

          {!isLoading && (error || (rows as any)?.message) && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Failed to load certificate data. Please try again.</p>
            </div>
          )}

          {!isLoading && rows.length === 0 && !(error) && (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No certificates issued yet</p>
              <p className="text-sm mt-1">Distribute certificates first, then generate bulk PDF</p>
            </div>
          )}

          {!isLoading && rows.length > 0 && (
            <>
              {/* Summary breakdown */}
              <div className="grid grid-cols-4 gap-3">
                {(["gold", "silver", "bronze", "participation"] as const).map(key => {
                  const count = typeGroups[key].length;
                  const colors = CERT_COLORS[key];
                  const labels = { gold: "Gold", silver: "Silver", bronze: "Bronze", participation: "Participation" };
                  return (
                    <div key={key} className={`rounded-lg p-3 text-center ${colors.bg}`}>
                      <div className={`w-3 h-3 rounded-full ${colors.dot} mx-auto mb-1`} />
                      <p className={`text-xl font-bold ${colors.text}`}>{count}</p>
                      <p className={`text-xs ${colors.text} opacity-80`}>{labels[key]}</p>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <strong>Print tip:</strong> Click "Print / Save as PDF" → In the print dialog, set <strong>Layout: Landscape</strong>, Margins: None, and choose "Save as PDF" to get individual certificate files.
              </div>

              {/* Hidden print container */}
              <div ref={printRef} className="hidden">
                {rows.map((row, i) => {
                  const sd: CertStudentData = {
                    studentName: row.studentName,
                    schoolName: row.schoolName,
                    olympiadName: row.olympiadName.toUpperCase(),
                    certNumber: row.verificationCode || `CERT-${i + 1}`,
                    indexNumber: `IDX-${String(i + 1).padStart(4, "0")}`,
                    grade: row.gradeLevel,
                    rank: String(row.rank ?? "—"),
                    percentage: row.score ? String(row.score) : "—",
                    date: row.issuedAt,
                  };
                  return (
                    <div key={i} className="bulk-cert-page" style={{ width: "297mm", height: "210mm", overflow: "hidden" }}>
                      <FullCertificatePreview
                        type={certTypeToDesignKey(row.certType)}
                        signatories={signatories}
                        studentData={sd}
                      />
                    </div>
                  );
                })}
              </div>

              {/* On-screen preview list */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview — All Certificates</p>
                {rows.map((row, i) => {
                  const key = certTypeToDesignKey(row.certType);
                  const colors = CERT_COLORS[key] || CERT_COLORS.participation;
                  const labels: Record<string, string> = { gold: "Gold Award", silver: "Silver Award", bronze: "Bronze Award", participation: "Participation" };
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors.bg}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${colors.text}`}>{row.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.schoolName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${colors.text} border-current`}>{labels[key]}</Badge>
                        {row.rank && <p className="text-xs text-muted-foreground mt-0.5">Rank {row.rank}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CertificateDesignerTab() {
  const { toast } = useToast();
  const [previewType, setPreviewType] = useState("gold");
  const [selectedOlympiad, setSelectedOlympiad] = useState<number | null>(null);
  const [goldThreshold, setGoldThreshold] = useState(90);
  const [silverThreshold, setSilverThreshold] = useState(75);
  const [bronzeThreshold, setBronzeThreshold] = useState(60);
  const [bulkPdfOpen, setBulkPdfOpen] = useState(false);

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/exams-list"],
    queryFn: () => fetch("/sysctrl/api/exams-list").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: publishedExamIds = [] } = useQuery<number[]>({
    queryKey: ["/api/certificates/published-exams"],
  });

  const { data: distributionStatus, refetch: refetchStatus, isLoading: statusLoading } = useQuery<{
    totalAttempts: number;
    distributedCertificates: number;
    breakdown: { type: string; count: number }[];
  }>({
    queryKey: ["/api/certificates/distribution-status", selectedOlympiad],
    enabled: !!selectedOlympiad,
  });

  const distributeMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/certificates/distribute", {
        examId: selectedOlympiad,
        goldThreshold,
        silverThreshold,
        bronzeThreshold,
      }),
    onSuccess: (data: any) => {
      toast({
        title: "Certificates Distributed",
        description: `${data.distributed} certificates issued. ${data.skipped} already had certificates.`,
      });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
    onError: () => {
      toast({ title: "Distribution Failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const signatories = {
    s1Name:  siteSettings?.certificate_signatory_1_name  || "Authorized Signatory",
    s1Title: siteSettings?.certificate_signatory_1_title || "Founder, Samikaran Olympiad",
    s2Name:  siteSettings?.certificate_signatory_2_name  || "Authorized Signatory",
    s2Title: siteSettings?.certificate_signatory_2_title || "Controller of Examinations (CoE)",
  };

  const completedExams = exams.filter((e: any) => publishedExamIds.includes(e.id));
  const selectedExam   = exams.find((e: any) => e.id === selectedOlympiad);

  const getBadgeColor = (type: string) => {
    const t = type.replace("merit_", "").toLowerCase();
    return CERT_COLORS[t]?.dot ?? "bg-emerald-500";
  };

  const issuedCount = distributionStatus?.distributedCertificates ?? 0;

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" /> Certificate Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Preview all 4 award templates, distribute certificates to students, and generate bulk PDFs for printing
          </p>
        </div>
        {selectedOlympiad && issuedCount > 0 && (
          <Button
            onClick={() => setBulkPdfOpen(true)}
            className="flex-shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white gap-2 shadow"
            data-testid="button-open-bulk-pdf"
          >
            <FileDown className="w-4 h-4" />
            Bulk PDF ({issuedCount})
          </Button>
        )}
      </div>

      {/* ── Section 1: Template Previews ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" /> Certificate Templates
          </CardTitle>
          <CardDescription>
            These are the official hardcoded designs used for every certificate issued
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={previewType} onValueChange={setPreviewType}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              {CERTIFICATE_TYPES.map((cert) => {
                const Icon = cert.icon;
                return (
                  <TabsTrigger key={cert.type} value={cert.type} className="text-xs" data-testid={`tab-cert-${cert.type}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {cert.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {CERTIFICATE_TYPES.map((cert) => (
              <TabsContent key={cert.type} value={cert.type}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <cert.icon className="w-5 h-5" />
                      <div>
                        <h3 className="text-base font-semibold">{cert.label}</h3>
                        <p className="text-sm text-muted-foreground">{cert.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">Hardcoded Design</Badge>
                  </div>
                  <FullCertificatePreview type={cert.type} signatories={signatories} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Section 2: Distribution Management ── */}
      <Card className="shadow-sm border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Distribute & Print Certificates</CardTitle>
              <CardDescription>Select an olympiad, set thresholds, distribute to students, then generate bulk PDFs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Controls */}
            <div className="lg:col-span-2 space-y-5">

              {/* Olympiad select */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Select Olympiad</Label>
                <Select
                  value={selectedOlympiad?.toString() || ""}
                  onValueChange={(v) => setSelectedOlympiad(parseInt(v))}
                >
                  <SelectTrigger className="h-11" data-testid="select-olympiad-distribute">
                    <SelectValue placeholder="Choose olympiad with published results..." />
                  </SelectTrigger>
                  <SelectContent>
                    {completedExams.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No olympiads with published results
                      </div>
                    ) : (
                      completedExams.map((exam: any) => (
                        <SelectItem key={exam.id} value={exam.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{exam.title}</span>
                            <Badge variant="secondary" className="text-xs capitalize">{exam.status}</Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Thresholds */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <Medal className="w-4 h-4 text-violet-500" />
                  Award Thresholds (% Score)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "gold",   label: "Gold",   dot: "bg-yellow-500", val: goldThreshold,   set: setGoldThreshold,   def: 90 },
                    { key: "silver", label: "Silver", dot: "bg-gray-400",   val: silverThreshold, set: setSilverThreshold, def: 75 },
                    { key: "bronze", label: "Bronze", dot: "bg-orange-500", val: bronzeThreshold, set: setBronzeThreshold, def: 60 },
                  ].map((t) => (
                    <div key={t.key} className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                        {t.label}
                      </Label>
                      <Input
                        type="number"
                        value={t.val}
                        onChange={(e) => t.set(parseInt(e.target.value) || t.def)}
                        min={0} max={100}
                        className="text-center font-semibold h-9"
                        data-testid={`input-${t.key}-threshold`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2.5">
                  Students below Bronze threshold receive a Participation certificate
                </p>
              </div>

              {/* Distribution Status */}
              {selectedOlympiad && (
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-500" />
                    Status — {selectedExam?.title}
                  </h4>
                  {statusLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : distributionStatus ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-blue-600">{distributionStatus.totalAttempts}</p>
                          <p className="text-xs text-blue-700">Total Participants</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-emerald-600">{issuedCount}</p>
                          <p className="text-xs text-emerald-700">Certificates Issued</p>
                        </div>
                      </div>
                      {distributionStatus.breakdown.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {distributionStatus.breakdown.map((b) => (
                            <Badge key={b.type} className={`${getBadgeColor(b.type)} text-white capitalize text-xs`}>
                              {b.type.replace("merit_", "")}: {b.count}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No distribution data yet</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow"
                  onClick={() => distributeMutation.mutate()}
                  disabled={!selectedOlympiad || distributeMutation.isPending}
                  data-testid="button-distribute-certificates"
                >
                  {distributeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Distributing...</>
                  ) : (
                    <><Award className="w-4 h-4 mr-2" /> Distribute Certificates</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="h-11 px-5 gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
                  onClick={() => setBulkPdfOpen(true)}
                  disabled={!selectedOlympiad || issuedCount === 0}
                  data-testid="button-bulk-pdf"
                  title={!selectedOlympiad ? "Select an olympiad first" : issuedCount === 0 ? "No certificates issued yet" : ""}
                >
                  <FileDown className="w-4 h-4" />
                  Bulk PDF
                  {issuedCount > 0 && (
                    <Badge className="bg-violet-600 text-white text-xs px-1.5 py-0 h-4">{issuedCount}</Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Info panels */}
            <div className="space-y-4">

              <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-violet-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {[
                    "Select an olympiad with published results",
                    "Set percentage thresholds for each award level",
                    'Click "Distribute Certificates"',
                    'Click "Bulk PDF" to generate printable PDFs',
                    "Print dialog → Save as PDF / Send to printer",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <p className="text-xs text-violet-800">{step}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Award Levels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { dot: "bg-yellow-500",  label: `Gold — ≥${goldThreshold}%`      },
                    { dot: "bg-gray-400",    label: `Silver — ≥${silverThreshold}%`  },
                    { dot: "bg-orange-500",  label: `Bronze — ≥${bronzeThreshold}%`  },
                    { dot: "bg-emerald-500", label: "Participation — All others"       },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${a.dot}`} />
                      <span className="text-xs text-amber-800">{a.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The certificate design is shown in the <strong>Templates</strong> section above — one per award type
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="mt-2 text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1 mx-auto transition-colors"
                >
                  View templates <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk PDF Modal ── */}
      {selectedOlympiad && (
        <BulkPdfModal
          open={bulkPdfOpen}
          onClose={() => setBulkPdfOpen(false)}
          examId={selectedOlympiad}
          examTitle={selectedExam?.title || ""}
          signatories={signatories}
        />
      )}
    </div>
  );
}
