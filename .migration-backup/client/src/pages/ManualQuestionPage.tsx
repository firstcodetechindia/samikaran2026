import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/hooks/use-toast";

const QUESTION_TYPES = [
  { value: "mcq_single", label: "MCQ (Single Correct)" },
  { value: "mcq_multiple", label: "MCQ (Multiple Correct)" },
  { value: "true_false", label: "True / False" },
  { value: "numerical", label: "Numerical / Integer" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Descriptive" },
  { value: "case_study", label: "Case Study Based" },
  { value: "image_based", label: "Image Based" },
  { value: "audio_based", label: "Audio Based" },
];

interface Option {
  text: string;
  isCorrect: boolean;
}

interface QuestionFormData {
  questionType: string;
  questionText: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  marks: number;
  imageUrl: string;
  audioUrl: string;
  status: string;
}

const getInitialFormData = (): QuestionFormData => ({
  questionType: "mcq_single",
  questionText: "",
  options: [
    { text: "Option A", isCorrect: false },
    { text: "Option B", isCorrect: false },
    { text: "Option C", isCorrect: false },
    { text: "Option D", isCorrect: false },
  ],
  correctAnswer: "",
  explanation: "",
  hint: "",
  marks: 4,
  imageUrl: "",
  audioUrl: "",
  status: "active",
});

export default function ManualQuestionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [formData, setFormData] = useState<QuestionFormData>(getInitialFormData());
  const [savedQuestions, setSavedQuestions] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/exams"],
  });

  const selectedExam = exams.find((e: any) => e.id.toString() === selectedExamId);

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      // Map frontend question types to backend types
      const typeMapping: Record<string, string> = {
        "mcq_single": "mcq",
        "mcq_multiple": "mcq",
        "true_false": "true_false",
        "numerical": "numerical",
        "short_answer": "short_answer",
        "long_answer": "long_answer",
        "case_study": "case_study",
        "image_based": "image_based",
        "audio_based": "audio_based",
      };
      
      // Build content JSON in the format expected by backend
      // { question: "HTML", options: [{id, text}], correctOptionId: "id" or correctOptionIds: ["id1", "id2"], explanation?: "text" }
      let content: any = {
        question: data.questionText,
        explanation: data.explanation || undefined,
        hint: data.hint || undefined,
      };

      if (data.questionType === "mcq_single" || data.questionType === "mcq_multiple" || 
          data.questionType === "image_based" || data.questionType === "audio_based") {
        // Build options with IDs
        const options = data.options
          .filter(o => o.text.trim())
          .map((o, index) => ({
            id: `opt_${index + 1}`,
            text: o.text,
          }));
        
        content.options = options;
        
        if (data.questionType === "mcq_single" || data.questionType === "image_based" || data.questionType === "audio_based") {
          // Find the correct option ID
          const correctIndex = data.options.findIndex(o => o.isCorrect && o.text.trim());
          content.correctOptionId = correctIndex >= 0 ? `opt_${correctIndex + 1}` : undefined;
        } else {
          // MCQ Multiple - store array of correct option IDs
          const correctIds = data.options
            .map((o, index) => o.isCorrect && o.text.trim() ? `opt_${index + 1}` : null)
            .filter(id => id !== null);
          content.correctOptionIds = correctIds;
        }
      } else if (data.questionType === "true_false") {
        content.options = [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ];
        content.correctOptionId = data.correctAnswer; // "true" or "false"
      } else {
        // Numerical, short answer, long answer, case study
        content.correctAnswer = data.correctAnswer;
      }

      const questionData = {
        examId: parseInt(selectedExamId),
        type: typeMapping[data.questionType] || "mcq",
        content,
        marks: data.marks,
        questionImageUrl: data.imageUrl || null,
        difficulty: selectedExam?.difficultyLevel || "medium",
      };
      return apiRequest("POST", "/api/questions", questionData);
    },
    onSuccess: () => {
      setSavedQuestions(prev => prev + 1);
      setFormData(getInitialFormData());
      setValidationErrors([]);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ 
        title: "Question Saved", 
        description: `Question #${savedQuestions + 1} saved successfully. You can add more questions.` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save question", 
        variant: "destructive" 
      });
    },
  });

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!selectedExamId) {
      errors.push("Please select an olympiad");
    }
    if (!formData.questionText.trim()) {
      errors.push("Question text is required");
    }
    if (formData.questionType === "mcq_single") {
      const hasOptions = formData.options.some(o => o.text.trim());
      const hasCorrect = formData.options.some(o => o.isCorrect && o.text.trim());
      if (!hasOptions) errors.push("Please add at least one option");
      if (!hasCorrect) errors.push("Please select the correct answer");
    }
    if (formData.questionType === "mcq_multiple") {
      const hasOptions = formData.options.some(o => o.text.trim());
      const hasCorrect = formData.options.some(o => o.isCorrect && o.text.trim());
      if (!hasOptions) errors.push("Please add at least one option");
      if (!hasCorrect) errors.push("Please select at least one correct answer");
    }
    if (formData.questionType === "true_false" && !formData.correctAnswer) {
      errors.push("Please select True or False as the correct answer");
    }
    if (["numerical", "short_answer"].includes(formData.questionType) && !formData.correctAnswer.trim()) {
      errors.push("Please enter the correct answer");
    }
    if (formData.marks <= 0) {
      errors.push("Marks must be greater than 0");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSaveQuestion = () => {
    if (validateForm()) {
      createQuestionMutation.mutate(formData);
    }
  };

  const handleOptionChange = (index: number, field: "text" | "isCorrect", value: string | boolean) => {
    const newOptions = [...formData.options];
    if (field === "isCorrect" && formData.questionType === "mcq_single") {
      newOptions.forEach((o, i) => o.isCorrect = i === index);
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value };
    }
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const renderAnswerInput = () => {
    switch (formData.questionType) {
      case "mcq_single":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Answer Options *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption} data-testid="button-add-option">
                <Plus className="w-4 h-4 mr-1" /> Add Option
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Click the radio button to mark the correct answer</p>
            <RadioGroup
              value={formData.options.findIndex(o => o.isCorrect).toString()}
              onValueChange={(val) => handleOptionChange(parseInt(val), "isCorrect", true)}
            >
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    className={option.isCorrect ? "border-green-500 text-green-500" : ""}
                    data-testid={`radio-option-${index}`}
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className={`flex-1 ${option.isCorrect ? "border-green-500 bg-green-50" : ""}`}
                    data-testid={`input-option-${index}`}
                  />
                  {option.isCorrect && (
                    <Badge className="bg-green-100 text-green-700">
                      <Check className="w-3 h-3 mr-1" /> Correct
                    </Badge>
                  )}
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-remove-option-${index}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "mcq_multiple":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Answer Options *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption} data-testid="button-add-option">
                <Plus className="w-4 h-4 mr-1" /> Add Option
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Check all correct answers</p>
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <Checkbox
                  checked={option.isCorrect}
                  onCheckedChange={(checked) => handleOptionChange(index, "isCorrect", !!checked)}
                  className={option.isCorrect ? "border-green-500 bg-green-500" : ""}
                  data-testid={`checkbox-option-${index}`}
                />
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className={`flex-1 ${option.isCorrect ? "border-green-500 bg-green-50" : ""}`}
                  data-testid={`input-option-${index}`}
                />
                {option.isCorrect && (
                  <Badge className="bg-green-100 text-green-700">
                    <Check className="w-3 h-3 mr-1" /> Correct
                  </Badge>
                )}
                {formData.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-remove-option-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-3">
            <Label className="text-base font-medium">Correct Answer *</Label>
            <RadioGroup
              value={formData.correctAnswer}
              onValueChange={(val) => setFormData({ ...formData, correctAnswer: val })}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="true" id="true" data-testid="radio-true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="false" id="false" data-testid="radio-false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case "numerical":
        return (
          <div className="space-y-2">
            <Label className="text-base font-medium">Correct Answer (Number) *</Label>
            <Input
              type="number"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              placeholder="Enter the correct numerical answer"
              data-testid="input-correct-answer"
            />
          </div>
        );

      case "short_answer":
        return (
          <div className="space-y-2">
            <Label className="text-base font-medium">Correct Answer *</Label>
            <Input
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              placeholder="Enter the correct short answer"
              data-testid="input-correct-answer"
            />
          </div>
        );

      case "image_based":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="Enter image URL for the question"
                data-testid="input-image-url"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Answer Options *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption} data-testid="button-add-option">
                  <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
              </div>
              <RadioGroup
                value={formData.options.findIndex(o => o.isCorrect).toString()}
                onValueChange={(val) => handleOptionChange(parseInt(val), "isCorrect", true)}
              >
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <RadioGroupItem value={index.toString()} id={`img-option-${index}`} data-testid={`radio-option-${index}`} />
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className={`flex-1 ${option.isCorrect ? "border-green-500 bg-green-50" : ""}`}
                      data-testid={`input-option-${index}`}
                    />
                    {option.isCorrect && <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" /> Correct</Badge>}
                    {formData.options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="opacity-0 group-hover:opacity-100" data-testid={`button-remove-option-${index}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case "audio_based":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Audio URL</Label>
              <Input
                value={formData.audioUrl}
                onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                placeholder="Enter audio file URL for the question"
                data-testid="input-audio-url"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Answer Options *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption} data-testid="button-add-option">
                  <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
              </div>
              <RadioGroup
                value={formData.options.findIndex(o => o.isCorrect).toString()}
                onValueChange={(val) => handleOptionChange(parseInt(val), "isCorrect", true)}
              >
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <RadioGroupItem value={index.toString()} id={`audio-option-${index}`} data-testid={`radio-option-${index}`} />
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className={`flex-1 ${option.isCorrect ? "border-green-500 bg-green-50" : ""}`}
                      data-testid={`input-option-${index}`}
                    />
                    {option.isCorrect && <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" /> Correct</Badge>}
                    {formData.options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} className="opacity-0 group-hover:opacity-100" data-testid={`button-remove-option-${index}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label className="text-base font-medium">Sample Answer / Model Answer</Label>
            <Textarea
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              placeholder="Enter a sample or model answer for reference"
              rows={4}
              data-testid="input-correct-answer"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/sysctrl/console")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Manual Question Creator</h1>
                <p className="text-sm text-muted-foreground">Create questions for olympiads</p>
              </div>
            </div>
            {savedQuestions > 0 && (
              <Badge variant="secondary" className="text-base px-4 py-2">
                {savedQuestions} question{savedQuestions > 1 ? "s" : ""} saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Card className="mb-4 border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50">
          <CardContent className="py-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Label className="font-medium whitespace-nowrap">Select Olympiad *</Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="flex-1 bg-white" data-testid="select-olympiad">
                  <SelectValue placeholder="Choose an Olympiad" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{exam.title}</span>
                        <Badge variant="outline" className="text-xs">{exam.subject}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedExam && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="text-xs">Subject: {selectedExam.subject}</Badge>
                <Badge variant="secondary" className="text-xs">Class: {selectedExam.minClass}-{selectedExam.maxClass}</Badge>
                <Badge variant="secondary" className="text-xs">Duration: {selectedExam.durationMinutes} min</Badge>
                <Badge variant="secondary" className="text-xs">Marks: {selectedExam.totalMarks}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedExamId && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Question Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Please fix the following errors:
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Question Type *</Label>
                  <Select 
                    value={formData.questionType} 
                    onValueChange={(val) => setFormData({ ...formData, questionType: val, correctAnswer: "", options: getInitialFormData().options })}
                  >
                    <SelectTrigger data-testid="select-question-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Marks *</Label>
                  <Input
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 0 })}
                    min={1}
                    data-testid="input-marks"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Question Text *</Label>
                <RichTextEditor
                  content={formData.questionText}
                  onChange={(val) => setFormData({ ...formData, questionText: val })}
                  placeholder="Enter your question here..."
                  minHeight="100px"
                />
              </div>

              {renderAnswerInput()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Explanation (Optional)</Label>
                  <Textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Explain the solution"
                    rows={2}
                    data-testid="input-explanation"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Hint (Optional)</Label>
                  <Textarea
                    value={formData.hint}
                    onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                    placeholder="Provide a hint"
                    rows={2}
                    data-testid="input-hint"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(getInitialFormData());
                    setValidationErrors([]);
                  }}
                  data-testid="button-clear"
                >
                  Clear Form
                </Button>
                <Button
                  onClick={handleSaveQuestion}
                  disabled={createQuestionMutation.isPending}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  data-testid="button-save-question"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createQuestionMutation.isPending ? "Saving..." : "Save & Add Next Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedExamId && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                Please select an olympiad above to start adding questions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
