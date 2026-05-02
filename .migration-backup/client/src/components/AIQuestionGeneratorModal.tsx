import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Sparkles, Check, X, Eye, ChevronLeft, AlertCircle, CheckCircle, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Exam {
  id: number;
  title: string;
  subject: string;
  totalMarks: number;
}

interface GeneratedQuestion {
  type: "mcq" | "true_false" | "image_based" | "text";
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  suggestedMarks: number;
  selected?: boolean;
  // Voice answer fields (for AI-generated voice questions)
  isVoiceEnabled?: boolean;
  spokenAnswerFormat?: "one_word" | "short_explanation" | "formula_term";
  voiceEvaluationMethod?: "exact_match" | "keyword_match" | "semantic_match";
  referenceAnswer?: string;
  voiceKeywords?: string[];
  confidenceThreshold?: number;
}

interface AIQuestionGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const languageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
];

export default function AIQuestionGeneratorModal({ open, onOpenChange, onSuccess }: AIQuestionGeneratorModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"configure" | "generating" | "preview">("configure");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("");
  const [mcqCount, setMcqCount] = useState(5);
  const [trueFalseCount, setTrueFalseCount] = useState(3);
  const [imageBasedCount, setImageBasedCount] = useState(0);
  const [language, setLanguage] = useState("en");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [marksPerQuestion, setMarksPerQuestion] = useState(4);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  // Voice question settings
  const [includeVoiceQuestions, setIncludeVoiceQuestions] = useState(false);
  const [voiceQuestionCount, setVoiceQuestionCount] = useState(2);

  const triggerShake = (fieldNames: string[]) => {
    setShakeFields(new Set(fieldNames));
    setErrorFields(new Set(fieldNames));
    setTimeout(() => setShakeFields(new Set()), 500);
  };

  const getInputClass = (fieldName: string, baseClass: string = "") => {
    const isShaking = shakeFields.has(fieldName);
    const hasError = errorFields.has(fieldName);
    return `${baseClass} ${isShaking ? "animate-shake" : ""} ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`;
  };

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    enabled: open,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sysctrl/questions/generate", {
        examId: selectedExamId,
        prompt,
        mcqCount,
        trueFalseCount,
        imageBasedCount,
        language,
        includeVoiceQuestions,
        voiceQuestionCount: includeVoiceQuestions ? voiceQuestionCount : 0,
      });
      return response as unknown as { questions: GeneratedQuestion[]; marksPerQuestion: number; provider: string };
    },
    onSuccess: (data) => {
      const questionsWithSelection = data.questions.map((q) => ({ ...q, selected: true }));
      setGeneratedQuestions(questionsWithSelection);
      setMarksPerQuestion(data.marksPerQuestion);
      setStep("preview");
      toast({ title: `${data.questions.length} questions generated successfully` });
    },
    onError: (error: any) => {
      setStep("configure");
      toast({ title: "Failed to generate questions", description: error.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const selectedQuestions = generatedQuestions.filter((q) => q.selected).map((q) => ({
        ...q,
        marks: marksPerQuestion,
        language,
      }));
      return await apiRequest("POST", "/api/sysctrl/questions/bulk", {
        examId: selectedExamId,
        questions: selectedQuestions,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: data.message || "Questions saved successfully" });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Failed to save questions", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setStep("configure");
    setSelectedExamId(null);
    setPrompt("");
    setMcqCount(5);
    setTrueFalseCount(3);
    setImageBasedCount(0);
    setLanguage("en");
    setGeneratedQuestions([]);
    setIncludeVoiceQuestions(false);
    setVoiceQuestionCount(2);
  };

  const handleGenerate = () => {
    const invalidFields: string[] = [];
    
    if (!selectedExamId) {
      invalidFields.push("examId");
    }
    
    if (mcqCount + trueFalseCount + imageBasedCount === 0) {
      invalidFields.push("questionCount");
    }
    
    if (invalidFields.length > 0) {
      triggerShake(invalidFields);
      if (!selectedExamId) {
        toast({ title: "Please select an olympiad", variant: "destructive" });
      } else {
        toast({ title: "Please specify at least one question type", variant: "destructive" });
      }
      return;
    }
    
    setErrorFields(new Set());
    setStep("generating");
    generateMutation.mutate();
  };

  const toggleQuestion = (index: number) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, selected: !q.selected } : q))
    );
  };

  const selectAll = () => {
    setGeneratedQuestions((prev) => prev.map((q) => ({ ...q, selected: true })));
  };

  const deselectAll = () => {
    setGeneratedQuestions((prev) => prev.map((q) => ({ ...q, selected: false })));
  };

  const selectedCount = generatedQuestions.filter((q) => q.selected).length;
  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mcq":
        return "bg-violet-100 text-violet-700";
      case "true_false":
        return "bg-cyan-100 text-cyan-700";
      case "image_based":
        return "bg-fuchsia-100 text-fuchsia-700";
      case "text":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "mcq":
        return "MCQ";
      case "true_false":
        return "True/False";
      case "image_based":
        return "Image-Based";
      case "text":
        return "Text/Theory";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Question Generator
          </DialogTitle>
          <DialogDescription>
            {step === "configure" && "Configure and generate olympiad questions using AI"}
            {step === "generating" && "Generating questions..."}
            {step === "preview" && "Review and approve generated questions"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
        {step === "configure" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Olympiad *</Label>
              <Select
                value={selectedExamId?.toString() || ""}
                onValueChange={(val) => {
                  setSelectedExamId(Number(val));
                  setErrorFields(prev => { const next = new Set(prev); next.delete("examId"); return next; });
                }}
              >
                <SelectTrigger className={getInputClass("examId")} data-testid="select-ai-exam">
                  <SelectValue placeholder="Choose an olympiad" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.title} ({exam.subject})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Generation Prompt</Label>
              <Textarea
                placeholder="Describe what kind of questions you want to generate... (e.g., Focus on algebraic equations and word problems for Grade 8 students)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="input-ai-prompt"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>MCQ Questions</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  data-testid="input-ai-mcq"
                />
              </div>
              <div className="space-y-2">
                <Label>True/False Questions</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={trueFalseCount}
                  onChange={(e) => setTrueFalseCount(Number(e.target.value))}
                  data-testid="input-ai-tf"
                />
              </div>
              <div className="space-y-2">
                <Label>Image-Based (MCQ)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={imageBasedCount}
                  onChange={(e) => setImageBasedCount(Number(e.target.value))}
                  data-testid="input-ai-image"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger data-testid="select-ai-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Questions Toggle */}
            <Card className="border-violet-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-violet-600" />
                    <div>
                      <p className="font-medium text-sm">Include Voice-Answer Questions</p>
                      <p className="text-xs text-muted-foreground">Generate questions that require spoken answers</p>
                    </div>
                  </div>
                  <Switch
                    checked={includeVoiceQuestions}
                    onCheckedChange={setIncludeVoiceQuestions}
                    data-testid="switch-include-voice"
                  />
                </div>
                {includeVoiceQuestions && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Voice Questions Count</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={voiceQuestionCount}
                        onChange={(e) => setVoiceQuestionCount(Number(e.target.value))}
                        className="w-24"
                        data-testid="input-voice-count"
                      />
                    </div>
                    <p className="text-xs text-violet-600">
                      AI will generate {voiceQuestionCount} text/theory question{voiceQuestionCount !== 1 ? "s" : ""} with voice answer configuration including:
                      reference answer, keywords, and evaluation method.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-violet-50 border-violet-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-violet-600 mt-0.5" />
                  <div className="text-sm text-violet-800">
                    <p className="font-medium">AI Generation Note</p>
                    <p className="text-violet-600">
                      Questions are generated using your configured AI provider. Review all generated questions before saving.
                      Total questions: {mcqCount + trueFalseCount + imageBasedCount + (includeVoiceQuestions ? voiceQuestionCount : 0)}
                      {includeVoiceQuestions && ` (including ${voiceQuestionCount} voice)`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "generating" && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">Generating Questions...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            <Progress className="w-64 mt-4" value={undefined} />
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                <Badge className="bg-violet-100 text-violet-700">
                  {generatedQuestions.length} Generated
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {selectedCount} Selected
                </Badge>
                {selectedExam && (
                  <Badge variant="outline">
                    {selectedExam.title}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <Accordion
                type="single"
                collapsible
                value={expandedQuestion || undefined}
                onValueChange={(val) => setExpandedQuestion(val)}
                className="space-y-2"
              >
                {generatedQuestions.map((question, index) => (
                  <AccordionItem
                    key={index}
                    value={`q-${index}`}
                    className={`border rounded-lg ${question.selected ? "border-violet-200 bg-violet-50/50" : "border-gray-200 bg-gray-50/50"}`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <Checkbox
                        checked={question.selected}
                        onCheckedChange={() => toggleQuestion(index)}
                        className="mt-1"
                        data-testid={`checkbox-question-${index}`}
                      />
                      <div className="flex-1">
                        <AccordionTrigger className="hover:no-underline p-0">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={getTypeColor(question.type)}>
                                {getTypeLabel(question.type)}
                              </Badge>
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline">{question.suggestedMarks} marks</Badge>
                              {question.isVoiceEnabled && (
                                <Badge className="bg-violet-500 text-white flex items-center gap-1">
                                  <Mic className="w-3 h-3" /> Voice
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 pr-4">
                              {question.question.replace(/<[^>]*>/g, "").slice(0, 150)}...
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-500">Question</Label>
                              <div 
                                className="text-sm p-2 bg-white rounded border" 
                                dangerouslySetInnerHTML={{ __html: question.question }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Options</Label>
                              <div className="space-y-1">
                                {question.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className={`text-sm p-2 rounded flex items-center gap-2 ${
                                      opt.id === question.correctOptionId
                                        ? "bg-emerald-50 border border-emerald-200"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <span className="font-medium uppercase">{opt.id}.</span>
                                    <span>{opt.text}</span>
                                    {opt.id === question.correctOptionId && (
                                      <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {question.explanation && (
                              <div>
                                <Label className="text-xs text-gray-500">Explanation</Label>
                                <p className="text-sm p-2 bg-blue-50 rounded border border-blue-100 text-blue-800">
                                  {question.explanation}
                                </p>
                              </div>
                            )}
                            {question.isVoiceEnabled && (
                              <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Mic className="w-4 h-4 text-violet-600" />
                                  <Label className="text-xs text-violet-700 font-medium">Voice Answer Configuration</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {question.referenceAnswer && (
                                    <div>
                                      <span className="text-gray-500">Reference Answer:</span>
                                      <p className="font-medium text-gray-700">{question.referenceAnswer}</p>
                                    </div>
                                  )}
                                  {question.spokenAnswerFormat && (
                                    <div>
                                      <span className="text-gray-500">Format:</span>
                                      <p className="font-medium text-gray-700 capitalize">{question.spokenAnswerFormat.replace(/_/g, " ")}</p>
                                    </div>
                                  )}
                                  {question.voiceEvaluationMethod && (
                                    <div>
                                      <span className="text-gray-500">Evaluation:</span>
                                      <p className="font-medium text-gray-700 capitalize">{question.voiceEvaluationMethod.replace(/_/g, " ")}</p>
                                    </div>
                                  )}
                                  {question.voiceKeywords && question.voiceKeywords.length > 0 && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500">Keywords:</span>
                                      <p className="font-medium text-gray-700">{question.voiceKeywords.join(", ")}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </div>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
        )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
          {step === "configure" && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                disabled={!selectedExamId || mcqCount + trueFalseCount + imageBasedCount === 0}
                data-testid="button-generate-questions"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Questions
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("configure")}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                Regenerate
              </Button>
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                disabled={selectedCount === 0 || saveMutation.isPending}
                data-testid="button-save-questions"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Check className="w-4 h-4 mr-2" />
                Save {selectedCount} Questions
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
