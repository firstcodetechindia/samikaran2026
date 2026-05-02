import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Award, Loader2, Trophy, Medal, Star, CheckCircle, Users } from "lucide-react";

interface CertificateDistributionPanelProps {
  exams: any[];
}

interface PublishedExam {
  examId: number;
  title: string;
  isPublished: boolean;
}

export default function CertificateDistributionPanel({ exams }: CertificateDistributionPanelProps) {
  const { toast } = useToast();
  const [selectedOlympiad, setSelectedOlympiad] = useState<number | null>(null);
  const [goldThreshold, setGoldThreshold] = useState(90);
  const [silverThreshold, setSilverThreshold] = useState(75);
  const [bronzeThreshold, setBronzeThreshold] = useState(60);

  // Fetch exams with published results
  const { data: publishedExamIds = [] } = useQuery<number[]>({
    queryKey: ["/api/certificates/published-exams"],
  });

  // Fetch distribution status for selected olympiad
  const { data: distributionStatus, refetch: refetchStatus, isLoading: statusLoading } = useQuery<{
    totalAttempts: number;
    distributedCertificates: number;
    breakdown: { type: string; count: number }[];
  }>({
    queryKey: ["/api/certificates/distribution-status", selectedOlympiad],
    enabled: !!selectedOlympiad,
  });

  // Distribute certificates mutation
  const distributeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/certificates/distribute", {
        examId: selectedOlympiad,
        goldThreshold,
        silverThreshold,
        bronzeThreshold,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Certificates Distributed",
        description: `${data.distributed} certificates have been issued. ${data.skipped} already had certificates.`,
      });
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
    onError: () => {
      toast({
        title: "Distribution Failed",
        description: "Failed to distribute certificates. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter to only show exams with published results
  const completedExams = exams.filter((e: any) => {
    return publishedExamIds.includes(e.id);
  });

  const selectedExam = exams.find((e: any) => e.id === selectedOlympiad);

  const getBadgeColor = (type: string) => {
    const cleanType = type.replace('merit_', '').toLowerCase();
    switch (cleanType) {
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      case 'bronze': return 'bg-orange-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Certificate Distribution</CardTitle>
              <CardDescription>Generate and distribute certificates for olympiads with announced results</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Selection & Thresholds */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-base font-semibold mb-2 block">Select Olympiad</Label>
                  <Select
                    value={selectedOlympiad?.toString() || ""}
                    onValueChange={(v) => setSelectedOlympiad(parseInt(v))}
                  >
                    <SelectTrigger className="h-12" data-testid="select-olympiad-distribute">
                      <SelectValue placeholder="Choose olympiad (results announced)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {completedExams.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No olympiads with published results
                        </div>
                      ) : (
                        completedExams.map((exam: any) => (
                          <SelectItem key={exam.id} value={exam.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{exam.title}</span>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {exam.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Threshold Settings */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-violet-500" />
                  Award Thresholds (% Score)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Gold
                    </Label>
                    <Input 
                      type="number" 
                      value={goldThreshold} 
                      onChange={(e) => setGoldThreshold(parseInt(e.target.value) || 90)}
                      min={0}
                      max={100}
                      className="text-center font-semibold"
                      data-testid="input-gold-threshold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      Silver
                    </Label>
                    <Input 
                      type="number" 
                      value={silverThreshold} 
                      onChange={(e) => setSilverThreshold(parseInt(e.target.value) || 75)}
                      min={0}
                      max={100}
                      className="text-center font-semibold"
                      data-testid="input-silver-threshold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      Bronze
                    </Label>
                    <Input 
                      type="number" 
                      value={bronzeThreshold} 
                      onChange={(e) => setBronzeThreshold(parseInt(e.target.value) || 60)}
                      min={0}
                      max={100}
                      className="text-center font-semibold"
                      data-testid="input-bronze-threshold"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Students below Bronze threshold receive Participation certificates
                </p>
              </div>

              {/* Distribution Status */}
              {selectedOlympiad && (
                <div className="bg-white rounded-xl p-5 border shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Distribution Status for: {selectedExam?.title}
                  </h4>
                  {statusLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading status...
                    </div>
                  ) : distributionStatus ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{distributionStatus.totalAttempts}</p>
                          <p className="text-sm text-blue-700">Total Participants</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-emerald-600">{distributionStatus.distributedCertificates}</p>
                          <p className="text-sm text-emerald-700">Certificates Issued</p>
                        </div>
                      </div>
                      {distributionStatus.breakdown.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {distributionStatus.breakdown.map((b) => (
                            <Badge key={b.type} className={`${getBadgeColor(b.type)} text-white capitalize`}>
                              {b.type.replace('merit_', '')}: {b.count}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No distribution data available</p>
                  )}
                </div>
              )}

              {/* Distribute Button */}
              <Button
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg font-semibold shadow-lg"
                onClick={() => distributeMutation.mutate()}
                disabled={!selectedOlympiad || distributeMutation.isPending}
                data-testid="button-distribute-certificates"
              >
                {distributeMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Distributing Certificates...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Distribute Certificates
                  </>
                )}
              </Button>
            </div>

            {/* Right Column - Instructions */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-violet-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white text-sm flex items-center justify-center">1</span>
                    <p className="text-sm text-violet-800">Select an olympiad with announced results</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white text-sm flex items-center justify-center">2</span>
                    <p className="text-sm text-violet-800">Set percentage thresholds for each award level</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white text-sm flex items-center justify-center">3</span>
                    <p className="text-sm text-violet-800">Click "Distribute Certificates" to generate for all participants</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white text-sm flex items-center justify-center">4</span>
                    <p className="text-sm text-violet-800">Students see certificates instantly in their dashboard</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Award Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <span className="text-sm text-amber-800">Gold - Top performers (≥{goldThreshold}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                    <span className="text-sm text-amber-800">Silver - High achievers (≥{silverThreshold}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span className="text-sm text-amber-800">Bronze - Good performance (≥{bronzeThreshold}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    <span className="text-sm text-amber-800">Participation - All others</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
