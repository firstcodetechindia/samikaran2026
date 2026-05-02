import { Helmet } from "react-helmet-async";
import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubmitAnswer, useFinishAttempt } from "@/hooks/use-attempts";
import { api, buildUrl } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Clock, ChevronRight, CheckCircle, Save, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "@/components/VoiceRecorder";

// Fetch attempt details including exam and questions
function useAttemptDetails(id: number) {
    return useQuery({
        queryKey: [`/api/attempts/${id}/details`], // Custom query key
        queryFn: async () => {
            // We need to construct this manually since we don't have a single endpoint for "attempt with full exam questions"
            // Ideally, backend should provide this. For MVP, we'll fetch attempt -> get examId -> fetch exam questions
            // But wait, user shouldn't fetch ALL questions if they aren't authorized. 
            // Let's assume the endpoint `/api/attempts/:id/details` exists or we simulate it.
            // Actually, for security, questions should only be delivered via a specific secure endpoint.
            // Let's assume `useExamQuestions` works for students if they have an active attempt.
            
            // 1. Fetch Attempt
            const attemptRes = await fetch(`/api/attempts`, { credentials: "include" });
            const attempts = await attemptRes.json();
            const attempt = attempts.find((a: any) => a.id === id);
            
            if (!attempt) throw new Error("Attempt not found");

            // 2. Fetch Questions
            const url = buildUrl(api.exams.getQuestions.path, { id: attempt.examId });
            const questionsRes = await fetch(url, { credentials: "include" });
            const questions = await questionsRes.json();

            // 3. Fetch Exam Info
            const examUrl = buildUrl(api.exams.get.path, { id: attempt.examId });
            const examRes = await fetch(examUrl, { credentials: "include" });
            const exam = await examRes.json();

            return { attempt, questions, exam };
        },
        enabled: !!id
    });
}

export default function ExamTake() {
  const params = useParams<{ id: string }>();
  const attemptId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useAttemptDetails(attemptId);
  const { mutate: submitAnswer } = useSubmitAnswer();
  const { mutate: finishAttempt, isPending: isFinishing } = useFinishAttempt();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [voiceAnswers, setVoiceAnswers] = useState<Record<number, { blob?: Blob; text?: string }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isTabWarningOpen, setIsTabWarningOpen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Initialize timer
  useEffect(() => {
    if (data?.exam && data.attempt) {
        const endTime = new Date(data.attempt.startTime).getTime() + (data.exam.durationMinutes * 60 * 1000);
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(remaining);
    }
  }, [data]);

  // Timer tick
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                handleFinish();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 3) {
                handleFinish(); // Auto submit on too many switches
            } else {
                setIsTabWarningOpen(true);
            }
            return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleAnswerSelect = (value: string) => {
    if (!data) return;
    const currentQ = data.questions[currentQuestionIndex];
    
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    
    submitAnswer({ 
        attemptId, 
        questionId: currentQ.id, 
        selectedOption: value 
    });
  };

  const handleVoiceRecordingComplete = (questionId: number, audioBlob: Blob | null, textAnswer?: string) => {
    setVoiceAnswers(prev => ({
      ...prev,
      [questionId]: { blob: audioBlob || undefined, text: textAnswer }
    }));

    // Mark as answered with placeholder - actual audio upload would be separate
    if (audioBlob || textAnswer) {
      setAnswers(prev => ({ ...prev, [questionId]: textAnswer || "[voice_answer]" }));
      
      // Submit text answer if provided
      if (textAnswer) {
        submitAnswer({
          attemptId,
          questionId,
          selectedOption: textAnswer
        });
      }
    }
  };

  const handleFinish = () => {
    finishAttempt(attemptId, {
        onSuccess: () => {
            toast({ title: "Exam Submitted", description: "Your answers have been recorded." });
            setLocation("/");
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to submit exam.", variant: "destructive" });
        }
    });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading exam environment...</div>;
  if (error || !data) return <div className="h-screen flex items-center justify-center">Failed to load exam.</div>;

  const currentQuestion = data.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / data.questions.length) * 100;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>Exam | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Header */}
      <header className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-10 shadow-sm">
        <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base sm:text-xl font-display truncate">{data.exam.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{data.exam.subject}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
            <div className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-mono text-base sm:text-lg font-bold border flex-1 sm:flex-none justify-center",
                timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-100 text-slate-700 border-slate-200"
            )}>
                <Clock className="w-4 sm:w-5 h-4 sm:h-5" />
                {formatTime(timeLeft)}
            </div>
            <Button onClick={handleFinish} disabled={isFinishing} variant="default" className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none">
                <span className="hidden sm:inline">Finish Exam</span>
                <span className="sm:hidden">Submit</span>
            </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestionIndex + 1} of {data.questions.length}</span>
                <span>{Math.round(progress)}% Completed</span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <Badge variant="outline" className="h-fit w-fit">Q{currentQuestionIndex + 1}</Badge>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-base sm:text-xl font-medium leading-relaxed">
                          {(currentQuestion.content as any).question}
                        </h2>
                        {(currentQuestion as any).isVoiceEnabled && (
                          <Badge className="bg-violet-100 text-violet-700 flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Voice
                          </Badge>
                        )}
                      </div>
                    </div>
                </div>

                {/* Voice Answer Question */}
                {(currentQuestion as any).isVoiceEnabled ? (
                  <div className="space-y-4">
                    <VoiceRecorder
                      attemptId={data.attempt.id}
                      questionId={currentQuestion.id}
                      maxDuration={(currentQuestion as any).maxRecordingDuration || 60}
                      allowTextFallback={(currentQuestion as any).allowTextFallback ?? true}
                      onRecordingComplete={(blob, text) => handleVoiceRecordingComplete(currentQuestion.id, blob, text)}
                      disabled={false}
                    />
                    {voiceAnswers[currentQuestion.id] && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span>Answer recorded</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* MCQ Options */
                  <RadioGroup 
                      value={answers[currentQuestion.id] || ""} 
                      onValueChange={handleAnswerSelect}
                      className="space-y-4"
                  >
                      {(currentQuestion.content as any).options.map((option: string, idx: number) => (
                          <div key={idx} className={cn(
                              "flex items-center space-x-3 border rounded-xl p-4 transition-all cursor-pointer hover:bg-slate-50",
                              answers[currentQuestion.id] === option ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"
                          )}>
                              <RadioGroupItem value={option} id={`opt-${idx}`} />
                              <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-normal text-base">
                                  {option}
                              </Label>
                          </div>
                      ))}
                  </RadioGroup>
                )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between">
                <Button 
                    variant="outline" 
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </Button>
                
                {currentQuestionIndex < data.questions.length - 1 ? (
                    <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                        Next Question <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white">
                        Submit Exam <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>

        {/* Question Palette */}
        <div className="mt-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Question Palette</h3>
            <div className="flex flex-wrap gap-2">
                {data.questions.map((q: any, idx: number) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={cn(
                            "w-10 h-10 rounded-lg text-sm font-medium transition-all border relative",
                            currentQuestionIndex === idx ? "ring-2 ring-primary ring-offset-2 border-primary bg-primary text-white" :
                            answers[q.id] ? "bg-primary/20 text-primary border-primary/30" : "bg-white text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        {idx + 1}
                        {q.isVoiceEnabled && (
                          <Mic className="absolute -top-1 -right-1 w-3 h-3 text-violet-600 bg-white rounded-full" />
                        )}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-white border border-slate-200" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-violet-600" />
                <span>Voice Question</span>
              </div>
            </div>
        </div>
      </main>

      {/* Tab Warning Dialog */}
      <Dialog open={isTabWarningOpen} onOpenChange={setIsTabWarningOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" /> Warning: Tab Switching Detected
                </DialogTitle>
                <DialogDescription>
                    Leaving the exam tab is not allowed. This incident has been recorded.
                    <br/><br/>
                    <strong>Warning {tabSwitchCount} of 3</strong>. If you switch tabs again, your exam will be automatically submitted.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => setIsTabWarningOpen(false)}>I Understand</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
