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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award, Crown, Medal, Star, Users, CheckCircle, Trophy,
  Loader2, ChevronRight
} from "lucide-react";
import { FullCertificatePreview, CERTIFICATE_TYPES } from "@/components/CertificatePreviewSection";

const CERT_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  gold:          { dot: "bg-yellow-500",  bg: "bg-yellow-50",  text: "text-yellow-800" },
  silver:        { dot: "bg-gray-400",    bg: "bg-gray-50",    text: "text-gray-700"   },
  bronze:        { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-800" },
  participation: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800" },
};

export default function CertificateDesignerTab() {
  const { toast } = useToast();
  const [previewType, setPreviewType] = useState("gold");
  const [selectedOlympiad, setSelectedOlympiad] = useState<number | null>(null);
  const [goldThreshold, setGoldThreshold] = useState(90);
  const [silverThreshold, setSilverThreshold] = useState(75);
  const [bronzeThreshold, setBronzeThreshold] = useState(60);

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

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" /> Certificate Management
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Preview all 4 award templates and distribute certificates to students
        </p>
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
                  <TabsTrigger
                    key={cert.type}
                    value={cert.type}
                    className="text-xs"
                    data-testid={`tab-cert-${cert.type}`}
                  >
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
              <CardTitle className="text-lg">Distribute Certificates</CardTitle>
              <CardDescription>Select an olympiad and set thresholds to issue certificates to all participants</CardDescription>
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
                          <p className="text-xl font-bold text-emerald-600">{distributionStatus.distributedCertificates}</p>
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

              {/* Distribute Button */}
              <Button
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow"
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
            </div>

            {/* Right: Info panels */}
            <div className="space-y-4">

              {/* How it works */}
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
                    "Students see certificates instantly in their dashboard",
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

              {/* Award types */}
              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Award Levels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { dot: "bg-yellow-500",  label: `Gold — ≥${goldThreshold}%`,      icon: Crown  },
                    { dot: "bg-gray-400",    label: `Silver — ≥${silverThreshold}%`,  icon: Medal  },
                    { dot: "bg-orange-500",  label: `Bronze — ≥${bronzeThreshold}%`,  icon: Award  },
                    { dot: "bg-emerald-500", label: "Participation — All others",       icon: Star   },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${a.dot}`} />
                      <span className="text-xs text-amber-800">{a.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Template preview hint */}
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The certificate design used is shown in the <strong>Templates</strong> section above — one per award type
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
    </div>
  );
}
