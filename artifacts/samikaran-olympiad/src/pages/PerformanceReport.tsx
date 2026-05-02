import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Award, User, School, Calendar, Trophy, Target, 
  CheckCircle2, XCircle, Loader2, GraduationCap,
  Medal, Star, FileText, Download, Printer, Eye
} from "lucide-react";
import {
  FullCertificatePreview,
  certTextFromSettings,
  CERT_TEXT_DEFAULTS,
} from "@/components/CertificatePreviewSection";

interface PerformanceData {
  certificateNumber: string;
  indexNumber: string;
  studentName: string;
  schoolName: string;
  grade: string;
  olympiadName: string;
  examDate: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: string;
  awardType: string;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  totalQuestions: number;
  subjects: Array<{
    name: string;
    score: number;
    total: number;
    percentage: number;
  }>;
  issuedAt: string;
  verificationStatus: "verified" | "invalid";
}

function DemoCertificatePreview({ certNumber }: { certNumber: string }) {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const certText = certTextFromSettings(settings ?? {});

  const sampleStudent = {
    certNumber: certNumber || "DEMO-PREVIEW",
    awardType: "gold" as const,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Sample Certificate Preview</p>
                <p className="text-sm text-amber-700 mt-1">
                  Certificate number <strong>{certNumber}</strong> has not been issued yet, or is a demo QR code.
                  The design below shows exactly what a real verified certificate will look like once issued.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full rounded-xl overflow-hidden shadow-xl border border-gray-200">
          <FullCertificatePreview
            type={sampleStudent.awardType}
            signatories={{
              s1Name:  settings?.["cert_signatory1_name"]  ?? "Founder",
              s1Title: settings?.["cert_signatory1_title"] ?? "Founder, Samikaran Olympiad",
              s2Name:  settings?.["cert_signatory2_name"]  ?? "Controller of Examinations (CoE)",
              s2Title: settings?.["cert_signatory2_title"] ?? "Controller of Examinations (CoE)",
            }}
            studentData={{
              studentName:  "Arjun Sharma",
              schoolName:   "Delhi Public School, New Delhi",
              grade:        "Grade 8",
              rank:         "1",
              percentage:   "96",
              indexNumber:  "A000001",
              certNumber:   sampleStudent.certNumber,
              olympiadName: "NATIONAL JUNIOR SCIENCE OLYMPIAD 2026",
              date:         "15th January 2026",
            }}
            certText={certText}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground pb-4">
          <p>This preview is generated from the live certificate template.</p>
          <p className="mt-1 text-purple-600 font-medium">www.samikaranolympiad.com</p>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceReport() {
  // Use window.location.search to properly get query parameters
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const certNumber = searchParams.get("cert") || "";
  const isDownloadMode = searchParams.get("download") === "true";

  const { data: performance, isLoading, error } = useQuery<PerformanceData>({
    queryKey: [`/api/certificates/verify/${certNumber}`],
    enabled: !!certNumber,
  });

  // Auto-trigger print dialog when in download mode and data is loaded
  useEffect(() => {
    if (isDownloadMode && performance && !isLoading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isDownloadMode, performance, isLoading]);

  const handleDownload = () => {
    // Open the actual certificate design page for download
    window.open(`/certificate?cert=${certNumber}&download=true`, '_blank');
  };

  if (!certNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
            <p className="text-muted-foreground">No certificate number provided for verification.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !performance) {
    return <DemoCertificatePreview certNumber={certNumber} />;
  }

  const getAwardColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "gold": return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white";
      case "silver": return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
      case "bronze": return "bg-gradient-to-r from-orange-400 to-amber-600 text-white";
      default: return "bg-gradient-to-r from-emerald-400 to-green-500 text-white";
    }
  };

  const getAwardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "gold": return <Trophy className="w-5 h-5" />;
      case "silver": return <Medal className="w-5 h-5" />;
      case "bronze": return <Award className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Verified Certificate</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SAMIKARAN Olympiad
          </h1>
          <p className="text-muted-foreground mt-2">Official Performance Report</p>
          
          <Button 
            onClick={handleDownload} 
            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white print:hidden"
            data-testid="button-download-certificate"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Certificate
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className={`${getAwardColor(performance.awardType)} p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getAwardIcon(performance.awardType)}
                <span className="text-lg font-bold uppercase">{performance.awardType} Award</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Rank: {performance.rank}
              </Badge>
            </div>
          </div>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Index Number</p>
                <p className="font-bold text-lg">{performance.indexNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Certificate Number</p>
                <p className="font-bold text-lg">{performance.certificateNumber}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Student Name</p>
                  <p className="font-semibold text-lg">{performance.studentName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <School className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="font-medium">{performance.schoolName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <p className="font-medium">{performance.grade}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Olympiad</p>
                  <p className="font-medium">{performance.olympiadName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Exam Date</p>
                  <p className="font-medium">{performance.examDate}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Performance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{performance.score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{performance.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Percentage</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{performance.correctAnswers}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{performance.incorrectAnswers}</p>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
              </div>
            </div>

            {performance.subjects && performance.subjects.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4">Subject-wise Performance</h3>
                  <div className="space-y-3">
                    {performance.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{subject.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${subject.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {subject.score}/{subject.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="text-center text-xs text-muted-foreground">
              <p>Certificate issued on: {performance.issuedAt}</p>
              <p className="mt-1">This is an official document from SAMIKARAN Olympiad</p>
              <p className="mt-2 text-purple-600 font-medium">www.samikaranolympiad.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
