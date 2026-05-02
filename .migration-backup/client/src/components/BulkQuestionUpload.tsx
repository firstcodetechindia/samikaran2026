import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Loader2, Upload, Download, FileSpreadsheet, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exam {
  id: number;
  title: string;
  subject: string;
}

interface ParsedQuestion {
  rowNumber: number;
  question: string;
  type: "mcq" | "true_false";
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  marks: number;
  negativeMarks?: number;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
  isValid: boolean;
  errors: string[];
}

interface BulkQuestionUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CSV_TEMPLATE = `question,type,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,difficulty,explanation
"What is the capital of France?",mcq,Paris,London,Berlin,Madrid,A,4,1,medium,"Paris is the capital and largest city of France"
"The Earth is flat.",true_false,True,False,,,B,2,0,easy,"The Earth is approximately spherical"
"What is 2 + 2?",mcq,3,4,5,6,B,2,0,easy,"Basic arithmetic"`;

export default function BulkQuestionUpload({ open, onOpenChange, onSuccess }: BulkQuestionUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "preview" | "uploading">("select");
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());

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

  const uploadMutation = useMutation({
    mutationFn: async (questions: ParsedQuestion[]) => {
      const validQuestions = questions.filter(q => q.isValid);
      const formattedQuestions = validQuestions.map(q => ({
        examId: selectedExamId,
        type: q.type,
        content: {
          question: q.question,
          options: q.type === "mcq" 
            ? [
                { id: "A", text: q.optionA },
                { id: "B", text: q.optionB },
                { id: "C", text: q.optionC || "" },
                { id: "D", text: q.optionD || "" },
              ].filter(o => o.text)
            : [
                { id: "A", text: "True" },
                { id: "B", text: "False" },
              ],
          correctOptionId: q.correctAnswer.toUpperCase(),
          explanation: q.explanation || "",
        },
        marks: q.marks,
        negativeMarks: q.negativeMarks || 0,
        difficulty: q.difficulty,
        language: "en",
      }));

      return await apiRequest("POST", "/api/sysctrl/questions/bulk", {
        examId: selectedExamId,
        questions: formattedQuestions,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: data.message || "Questions uploaded successfully" });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Failed to upload questions", description: error.message, variant: "destructive" });
      setStep("preview");
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setStep("select");
    setSelectedExamId(null);
    setParsedQuestions([]);
    setUploadError(null);
    setErrorFields(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "question_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Template downloaded" });
    } else {
      toast({ title: "Excel template", description: "Use the CSV template and save as .xlsx in Excel" });
    }
  };

  const parseCSV = (content: string): ParsedQuestion[] => {
    const lines = content.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error("File must have a header row and at least one data row");
    }

    const header = lines[0].toLowerCase();
    if (!header.includes("question") || !header.includes("type")) {
      throw new Error("Invalid file format. Please use the template.");
    }

    const questions: ParsedQuestion[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);
      
      if (values.length < 7) continue;

      const errors: string[] = [];
      const question = values[0]?.trim() || "";
      const type = (values[1]?.trim().toLowerCase() || "mcq") as "mcq" | "true_false";
      const optionA = values[2]?.trim() || "";
      const optionB = values[3]?.trim() || "";
      const optionC = values[4]?.trim() || "";
      const optionD = values[5]?.trim() || "";
      const correctAnswer = values[6]?.trim().toUpperCase() || "A";
      const marks = parseInt(values[7] || "4") || 4;
      const negativeMarks = parseInt(values[8] || "0") || 0;
      const difficulty = (values[9]?.trim().toLowerCase() || "medium") as "easy" | "medium" | "hard";
      const explanation = values[10]?.trim() || "";

      if (!question) errors.push("Question is required");
      if (!optionA) errors.push("Option A is required");
      if (!optionB) errors.push("Option B is required");
      if (type === "mcq" && !["A", "B", "C", "D"].includes(correctAnswer)) {
        errors.push("Correct answer must be A, B, C, or D");
      }
      if (type === "true_false" && !["A", "B"].includes(correctAnswer)) {
        errors.push("Correct answer must be A (True) or B (False)");
      }
      if (!["easy", "medium", "hard"].includes(difficulty)) {
        errors.push("Difficulty must be easy, medium, or hard");
      }

      questions.push({
        rowNumber: i + 1,
        question,
        type,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        marks,
        negativeMarks,
        difficulty,
        explanation,
        isValid: errors.length === 0,
        errors,
      });
    }

    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setUploadError("Please upload a CSV or Excel file");
      return;
    }

    try {
      setUploadError(null);
      
      if (fileName.endsWith(".csv")) {
        const content = await file.text();
        const questions = parseCSV(content);
        setParsedQuestions(questions);
        setStep("preview");
      } else {
        setUploadError("Excel files (.xlsx/.xls) require conversion to CSV. Please save your Excel file as CSV and upload again.");
      }
    } catch (error: any) {
      setUploadError(error.message || "Failed to parse file");
      setParsedQuestions([]);
    }
  };

  const removeQuestion = (index: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (!selectedExamId) {
      triggerShake(["examId"]);
      toast({ title: "Please select an olympiad", variant: "destructive" });
      return;
    }

    const validQuestions = parsedQuestions.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      toast({ title: "No valid questions to upload", variant: "destructive" });
      return;
    }

    setStep("uploading");
    uploadMutation.mutate(parsedQuestions);
  };

  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const invalidCount = parsedQuestions.filter(q => !q.isValid).length;
  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-violet-500" />
            Bulk Question Upload
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Upload questions from CSV or Excel file"}
            {step === "preview" && "Review and confirm questions to upload"}
            {step === "uploading" && "Uploading questions..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
        {step === "select" && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Olympiad *</Label>
              <Select
                value={selectedExamId?.toString() || ""}
                onValueChange={(val) => {
                  setSelectedExamId(Number(val));
                  setErrorFields(prev => { const next = new Set(prev); next.delete("examId"); return next; });
                }}
              >
                <SelectTrigger className={getInputClass("examId")} data-testid="select-bulk-exam">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Download Template</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTemplate("csv")}
                    data-testid="button-download-csv"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV Template
                  </Button>
                </div>
              </div>

              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Select File
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: CSV (recommended)
                  </p>
                </CardContent>
              </Card>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Template Format</h4>
              <p className="text-sm text-muted-foreground mb-2">Your file should have these columns:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><Badge variant="secondary">question</Badge> - Question text (required)</div>
                <div><Badge variant="secondary">type</Badge> - mcq or true_false</div>
                <div><Badge variant="secondary">optionA</Badge> - First option (required)</div>
                <div><Badge variant="secondary">optionB</Badge> - Second option (required)</div>
                <div><Badge variant="secondary">optionC</Badge> - Third option (MCQ only)</div>
                <div><Badge variant="secondary">optionD</Badge> - Fourth option (MCQ only)</div>
                <div><Badge variant="secondary">correctAnswer</Badge> - A, B, C, or D</div>
                <div><Badge variant="secondary">marks</Badge> - Points for correct</div>
                <div><Badge variant="secondary">negativeMarks</Badge> - Penalty for wrong</div>
                <div><Badge variant="secondary">difficulty</Badge> - easy, medium, hard</div>
                <div><Badge variant="secondary">explanation</Badge> - Answer explanation</div>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col flex-1 overflow-hidden space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
              {selectedExam && (
                <Badge variant="secondary">
                  Target: {selectedExam.title}
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-20">Answer</TableHead>
                    <TableHead className="w-20">Marks</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedQuestions.map((q, index) => (
                    <TableRow key={index} className={!q.isValid ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-sm">{q.rowNumber}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">{q.question}</div>
                        {q.errors.length > 0 && (
                          <div className="text-xs text-destructive mt-1">
                            {q.errors.join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {q.type === "mcq" ? "MCQ" : "T/F"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{q.correctAnswer}</TableCell>
                      <TableCell>{q.marks}</TableCell>
                      <TableCell>
                        {q.isValid ? (
                          <Badge variant="outline" className="text-emerald-600 bg-emerald-50">
                            <Check className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          data-testid={`button-remove-question-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {step === "uploading" && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-violet-500 mb-4" />
            <p className="text-muted-foreground">Uploading {validCount} questions...</p>
            <Progress value={50} className="w-64 mx-auto mt-4" />
          </div>
        )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 border-t pt-4">
          {step === "select" && (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {step === "preview" && (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={validCount === 0 || uploadMutation.isPending}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {validCount} Questions
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
