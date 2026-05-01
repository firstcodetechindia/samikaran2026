import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Award, Crown, Medal, Star, Users, CheckCircle, Trophy,
  Loader2, ChevronRight, FileDown, Printer, X, AlertCircle,
  Save, Settings2, Type, PenLine, UserCheck, Upload, ImageIcon,
} from "lucide-react";
import {
  FullCertificatePreview,
  CERTIFICATE_TYPES,
  CertStudentData,
  CertTextConfig,
  CERT_TEXT_DEFAULTS,
  certTextFromSettings,
} from "@/components/CertificatePreviewSection";

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
  certText,
}: {
  open: boolean;
  onClose: () => void;
  examId: number;
  examTitle: string;
  signatories: { s1Name: string; s1Title: string; s2Name: string; s2Title: string };
  certText: CertTextConfig;
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
                        certText={certText}
                      />
                    </div>
                  );
                })}
              </div>

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
  const [bulkPdfOpen, setBulkPdfOpen] = useState(false);

  // ── Award threshold local state (initialized from settings below) ──
  const [goldThreshold, setGoldThreshold]   = useState(90);
  const [silverThreshold, setSilverThreshold] = useState(75);
  const [bronzeThreshold, setBronzeThreshold] = useState(60);

  // ── Signatory local state ──
  const [s1Name,  setS1Name]  = useState("Authorized Signatory");
  const [s1Title, setS1Title] = useState("Founder, Samikaran Olympiad");
  const [s1Image, setS1Image] = useState("");
  const [s2Name,  setS2Name]  = useState("Authorized Signatory");
  const [s2Title, setS2Title] = useState("Controller of Examinations (CoE)");
  const [s2Image, setS2Image] = useState("");
  const [s1Uploading, setS1Uploading] = useState(false);
  const [s2Uploading, setS2Uploading] = useState(false);

  // ── Certificate text local state ──
  const [introText,          setIntroText]          = useState(CERT_TEXT_DEFAULTS.introText);
  const [achievementPrefix,  setAchievementPrefix]  = useState(CERT_TEXT_DEFAULTS.achievementPrefix);
  const [dateLabel,          setDateLabel]          = useState(CERT_TEXT_DEFAULTS.dateLabel);
  const [footerNote,         setFooterNote]         = useState(CERT_TEXT_DEFAULTS.footerNote);
  const [goldTitle,          setGoldTitle]          = useState(CERT_TEXT_DEFAULTS.goldTitle);
  const [silverTitle,        setSilverTitle]        = useState(CERT_TEXT_DEFAULTS.silverTitle);
  const [bronzeTitle,        setBronzeTitle]        = useState(CERT_TEXT_DEFAULTS.bronzeTitle);
  const [participationTitle, setParticipationTitle] = useState(CERT_TEXT_DEFAULTS.participationTitle);

  // ── Queries ──
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

  // ── Initialize form state from DB settings ──
  useEffect(() => {
    if (!siteSettings) return;
    if (siteSettings.certificate_gold_threshold)   setGoldThreshold(parseInt(siteSettings.certificate_gold_threshold)   || 90);
    if (siteSettings.certificate_silver_threshold) setSilverThreshold(parseInt(siteSettings.certificate_silver_threshold) || 75);
    if (siteSettings.certificate_bronze_threshold) setBronzeThreshold(parseInt(siteSettings.certificate_bronze_threshold) || 60);
    if (siteSettings.certificate_signatory_1_name)  setS1Name(siteSettings.certificate_signatory_1_name);
    if (siteSettings.certificate_signatory_1_title) setS1Title(siteSettings.certificate_signatory_1_title);
    if (siteSettings.certificate_signatory_1_image) setS1Image(siteSettings.certificate_signatory_1_image);
    if (siteSettings.certificate_signatory_2_name)  setS2Name(siteSettings.certificate_signatory_2_name);
    if (siteSettings.certificate_signatory_2_title) setS2Title(siteSettings.certificate_signatory_2_title);
    if (siteSettings.certificate_signatory_2_image) setS2Image(siteSettings.certificate_signatory_2_image);
    if (siteSettings.certificate_intro_text)          setIntroText(siteSettings.certificate_intro_text);
    if (siteSettings.certificate_achievement_prefix)  setAchievementPrefix(siteSettings.certificate_achievement_prefix);
    if (siteSettings.certificate_date_label)          setDateLabel(siteSettings.certificate_date_label);
    if (siteSettings.certificate_footer_note)         setFooterNote(siteSettings.certificate_footer_note);
    if (siteSettings.certificate_gold_title)          setGoldTitle(siteSettings.certificate_gold_title);
    if (siteSettings.certificate_silver_title)        setSilverTitle(siteSettings.certificate_silver_title);
    if (siteSettings.certificate_bronze_title)        setBronzeTitle(siteSettings.certificate_bronze_title);
    if (siteSettings.certificate_participation_title) setParticipationTitle(siteSettings.certificate_participation_title);
  }, [siteSettings]);

  // ── Mutations ──
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

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/sysctrl/settings/bulk", {
        settings: [
          { key: "certificate_gold_threshold",       value: String(goldThreshold),    category: "certificate" },
          { key: "certificate_silver_threshold",      value: String(silverThreshold),  category: "certificate" },
          { key: "certificate_bronze_threshold",      value: String(bronzeThreshold),  category: "certificate" },
          { key: "certificate_signatory_1_name",      value: s1Name,                   category: "certificate" },
          { key: "certificate_signatory_1_title",     value: s1Title,                  category: "certificate" },
          { key: "certificate_signatory_1_image",     value: s1Image,                  category: "certificate" },
          { key: "certificate_signatory_2_name",      value: s2Name,                   category: "certificate" },
          { key: "certificate_signatory_2_title",     value: s2Title,                  category: "certificate" },
          { key: "certificate_signatory_2_image",     value: s2Image,                  category: "certificate" },
          { key: "certificate_intro_text",            value: introText,                category: "certificate" },
          { key: "certificate_achievement_prefix",    value: achievementPrefix,        category: "certificate" },
          { key: "certificate_date_label",            value: dateLabel,                category: "certificate" },
          { key: "certificate_footer_note",           value: footerNote,               category: "certificate" },
          { key: "certificate_gold_title",            value: goldTitle,                category: "certificate" },
          { key: "certificate_silver_title",          value: silverTitle,              category: "certificate" },
          { key: "certificate_bronze_title",          value: bronzeTitle,              category: "certificate" },
          { key: "certificate_participation_title",   value: participationTitle,       category: "certificate" },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/settings"] });
      toast({ title: "Certificate Settings Saved", description: "All settings have been persisted to the database." });
    },
    onError: () => {
      toast({ title: "Save Failed", description: "Please try again.", variant: "destructive" });
    },
  });

  // ── Signature image upload helper ──
  const uploadSignatureImage = async (
    file: File,
    setImage: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image must be under 2 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const { uploadURL, objectPath } = await res.json();
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setImage(objectPath);
      toast({ title: "Signature uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ── Derived values ──
  const signatories = { s1Name, s1Title, s1Image, s2Name, s2Title, s2Image };

  const certText: CertTextConfig = {
    introText, achievementPrefix, dateLabel, footerNote,
    goldTitle, silverTitle, bronzeTitle, participationTitle,
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
            Configure certificate settings, preview all 4 award templates, distribute to students, and generate bulk PDFs
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

      {/* ── Section 1: Certificate Settings ── */}
      <Card className="shadow-sm border-violet-200">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shadow">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Certificate Settings</CardTitle>
                <CardDescription>Award thresholds, signatories, and text templates — all persisted to the database</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white gap-2"
              data-testid="button-save-cert-settings"
            >
              {saveSettingsMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Settings</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">

          {/* 1a: Award Thresholds */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm">
              <Medal className="w-4 h-4 text-amber-500" />
              Award Level Thresholds (% score)
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Students scoring at or above a threshold receive that award. Below Bronze → Participation certificate.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "gold",   label: "Gold ≥",   dot: "bg-yellow-500", dotBorder: "border-yellow-300", val: goldThreshold,   set: setGoldThreshold,   def: 90 },
                { key: "silver", label: "Silver ≥", dot: "bg-gray-400",   dotBorder: "border-gray-300",   val: silverThreshold, set: setSilverThreshold, def: 75 },
                { key: "bronze", label: "Bronze ≥", dot: "bg-orange-500", dotBorder: "border-orange-300", val: bronzeThreshold, set: setBronzeThreshold, def: 60 },
              ].map((t) => (
                <div key={t.key} className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${t.dot} flex-shrink-0`} />
                    {t.label}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={t.val}
                      onChange={(e) => t.set(parseInt(e.target.value) || t.def)}
                      min={0} max={100}
                      className="text-center font-bold text-lg h-12 pr-8"
                      data-testid={`input-${t.key}-threshold`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 1b: Signatories */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Signatories
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Names and titles shown at the bottom of every certificate.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {/* Signatory 1 */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Signatory 1 (Left)</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={s1Name}
                    onChange={(e) => setS1Name(e.target.value)}
                    placeholder="Authorized Signatory"
                    data-testid="input-signatory-1-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title / Designation</Label>
                  <Input
                    value={s1Title}
                    onChange={(e) => setS1Title(e.target.value)}
                    placeholder="Founder, Samikaran Olympiad"
                    data-testid="input-signatory-1-title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Signature Image (optional)</Label>
                  {s1Image && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <img src={s1Image} alt="Sig 1" className="h-10 object-contain border rounded bg-white px-2" />
                      <Button size="sm" variant="ghost" className="text-xs text-red-500 h-8 px-2" onClick={() => setS1Image("")} data-testid="button-remove-sig1-image">Remove</Button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-sig1-image"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadSignatureImage(f, setS1Image, setS1Uploading);
                        e.target.value = "";
                      }}
                    />
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 pointer-events-none" disabled={s1Uploading} data-testid="button-upload-sig1">
                      {s1Uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {s1Uploading ? "Uploading..." : s1Image ? "Replace Signature" : "Upload Signature"}
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground">PNG/JPG with transparent background recommended.</p>
                </div>
              </div>
              {/* Signatory 2 */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Signatory 2 (Right)</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={s2Name}
                    onChange={(e) => setS2Name(e.target.value)}
                    placeholder="Authorized Signatory"
                    data-testid="input-signatory-2-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title / Designation</Label>
                  <Input
                    value={s2Title}
                    onChange={(e) => setS2Title(e.target.value)}
                    placeholder="Controller of Examinations (CoE)"
                    data-testid="input-signatory-2-title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Signature Image (optional)</Label>
                  {s2Image && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <img src={s2Image} alt="Sig 2" className="h-10 object-contain border rounded bg-white px-2" />
                      <Button size="sm" variant="ghost" className="text-xs text-red-500 h-8 px-2" onClick={() => setS2Image("")} data-testid="button-remove-sig2-image">Remove</Button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-sig2-image"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadSignatureImage(f, setS2Image, setS2Uploading);
                        e.target.value = "";
                      }}
                    />
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 pointer-events-none" disabled={s2Uploading} data-testid="button-upload-sig2">
                      {s2Uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {s2Uploading ? "Uploading..." : s2Image ? "Replace Signature" : "Upload Signature"}
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground">PNG/JPG with transparent background recommended.</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 1c: Certificate Text Templates */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm">
              <Type className="w-4 h-4 text-violet-500" />
              Certificate Text Templates
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Customise all text fields that appear on the printed certificate. Student name, rank, grade, and score are filled in automatically.
            </p>

            {/* Certificate titles per award */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Certificate Title (per award type)</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Gold Award Title",          dot: "bg-yellow-500",  val: goldTitle,          set: setGoldTitle,          id: "input-cert-title-gold" },
                  { label: "Silver Award Title",         dot: "bg-gray-400",    val: silverTitle,         set: setSilverTitle,         id: "input-cert-title-silver" },
                  { label: "Bronze Award Title",         dot: "bg-orange-500",  val: bronzeTitle,         set: setBronzeTitle,         id: "input-cert-title-bronze" },
                  { label: "Participation Award Title",  dot: "bg-emerald-500", val: participationTitle,  set: setParticipationTitle,  id: "input-cert-title-participation" },
                ].map((t) => (
                  <div key={t.label} className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                      {t.label}
                    </Label>
                    <Input
                      value={t.val}
                      onChange={(e) => t.set(e.target.value)}
                      className="uppercase font-semibold text-sm tracking-wide"
                      data-testid={t.id}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Body text fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <PenLine className="w-3 h-3" />
                  Intro line
                </Label>
                <Input
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder="This is to certify with honour that"
                  data-testid="input-cert-intro-text"
                />
                <p className="text-xs text-muted-foreground">Appears above the student name in italic.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <PenLine className="w-3 h-3" />
                  Achievement prefix
                </Label>
                <Input
                  value={achievementPrefix}
                  onChange={(e) => setAchievementPrefix(e.target.value)}
                  placeholder="for outstanding performance in"
                  data-testid="input-cert-achievement-prefix"
                />
                <p className="text-xs text-muted-foreground">Appears before the grade and olympiad name.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <PenLine className="w-3 h-3" />
                  Date label
                </Label>
                <Input
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  placeholder="Date of Examination:"
                  data-testid="input-cert-date-label"
                />
                <p className="text-xs text-muted-foreground">Label next to the exam date.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <PenLine className="w-3 h-3" />
                  Footer validity note
                </Label>
                <Textarea
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  rows={3}
                  className="resize-none text-xs"
                  data-testid="input-cert-footer-note"
                />
                <p className="text-xs text-muted-foreground">Small italic note at the bottom-right corner.</p>
              </div>
            </div>
          </div>

          {/* Live preview strip */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Live Preview (Gold template)</p>
            <div className="w-full" style={{ aspectRatio: "1.414 / 1" }}>
              <FullCertificatePreview type={previewType} signatories={signatories} certText={certText} />
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              {CERTIFICATE_TYPES.map((c) => (
                <button
                  key={c.type}
                  onClick={() => setPreviewType(c.type)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${previewType === c.type ? "bg-violet-600 text-white border-violet-600" : "text-muted-foreground hover:bg-violet-50 border-gray-200"}`}
                  data-testid={`tab-settings-preview-${c.type}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

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
              <CardDescription>Select an olympiad, confirm thresholds, distribute to students, then generate bulk PDFs</CardDescription>
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

              {/* Thresholds (read-only summary pointing to settings above) */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                  <Medal className="w-4 h-4 text-violet-500" />
                  Award Thresholds
                  <Badge variant="secondary" className="text-xs ml-auto">From Settings</Badge>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "gold",   label: "Gold",   dot: "bg-yellow-500", val: goldThreshold   },
                    { key: "silver", label: "Silver", dot: "bg-gray-400",   val: silverThreshold },
                    { key: "bronze", label: "Bronze", dot: "bg-orange-500", val: bronzeThreshold },
                  ].map((t) => (
                    <div key={t.key} className="text-center bg-white rounded-lg p-3 border">
                      <div className={`w-3 h-3 rounded-full ${t.dot} mx-auto mb-1`} />
                      <p className="text-lg font-bold">{t.val}%</p>
                      <p className="text-xs text-muted-foreground">{t.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2.5">
                  To adjust thresholds, update them in the <strong>Certificate Settings</strong> panel above and save.
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
                    "Configure thresholds & text in Certificate Settings above",
                    "Click Save Settings",
                    "Select an olympiad with published results",
                    'Click "Distribute Certificates"',
                    'Click "Bulk PDF" → Print / Save as PDF',
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
          certText={certText}
        />
      )}
    </div>
  );
}
