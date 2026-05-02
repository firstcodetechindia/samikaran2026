import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Eye, ImagePlus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ManualQuestionCreatorProps {
  exams: any[];
  onSuccess: () => void;
}

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

const DIFFICULTY_LEVELS = [
  { value: "very_easy", label: "Very Easy", color: "bg-green-100 text-green-700" },
  { value: "easy", label: "Easy", color: "bg-emerald-100 text-emerald-700" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700" },
  { value: "hard", label: "Hard", color: "bg-orange-100 text-orange-700" },
  { value: "olympiad", label: "Olympiad Level", color: "bg-red-100 text-red-700" },
];


export function ManualQuestionCreator({ exams, onSuccess }: ManualQuestionCreatorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    examId: "",
    questionType: "mcq_single",
    questionText: "",
    difficulty: "medium",
    marks: 4,
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    correctAnswer: "",
    explanation: "",
    hint: "",
    imageUrl: "",
    audioUrl: "", // For audio-based questions
    status: "draft",
  });

  const [showPreview, setShowPreview] = useState(false);

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const questionData = {
        examId: parseInt(data.examId),
        text: data.questionText,
        type: data.questionType,
        options: data.questionType.startsWith("mcq") || data.questionType === "true_false" 
          ? data.options.map((o: any) => o.text).filter((t: string) => t.trim())
          : [],
        correctAnswer: data.questionType === "true_false" 
          ? data.correctAnswer 
          : data.options.find((o: any) => o.isCorrect)?.text || data.correctAnswer,
        explanation: data.explanation,
        marks: data.marks,
        difficulty: data.difficulty,
        imageUrl: data.imageUrl || null,
        audioUrl: data.audioUrl || null,
      };
      return apiRequest("POST", "/api/questions", questionData);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

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
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.examId) {
      alert("Please select an olympiad");
      return;
    }
    if (!formData.questionText.trim()) {
      alert("Please enter question text");
      return;
    }
    createQuestionMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 pb-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Question Content</TabsTrigger>
          <TabsTrigger value="answers">Answers & Options</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Olympiad *</Label>
              <Select value={formData.examId} onValueChange={(v) => setFormData({ ...formData, examId: v })}>
                <SelectTrigger data-testid="select-olympiad">
                  <SelectValue placeholder="Choose olympiad" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question Type *</Label>
              <Select value={formData.questionType} onValueChange={(v) => setFormData({ ...formData, questionType: v })}>
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

            </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Question Text *</Label>
            <RichTextEditor
              content={formData.questionText}
              onChange={(html) => setFormData({ ...formData, questionText: html })}
              placeholder="Enter your question here with rich formatting..."
              minHeight="150px"
            />
            <p className="text-xs text-muted-foreground">Tip: Use LaTeX for math formulas: $x^2 + y^2 = z^2$</p>
          </div>

          <div className="space-y-2">
            <Label>Image URL (Optional)</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="https://example.com/image.png"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                data-testid="input-image-url"
              />
              <Button variant="outline" size="icon">
                <ImagePlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {formData.imageUrl && (
            <div className="relative w-full max-w-md">
              <img src={formData.imageUrl} alt="Question" className="rounded-lg border" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setFormData({ ...formData, imageUrl: "" })}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {formData.questionType === "audio_based" && (
            <div className="space-y-2">
              <Label>Audio URL *</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://example.com/audio.mp3"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  data-testid="input-audio-url"
                />
              </div>
              <p className="text-xs text-muted-foreground">Supported formats: MP3, WAV, OGG</p>
              {formData.audioUrl && (
                <audio controls className="w-full mt-2">
                  <source src={formData.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="space-y-4 mt-4">
          {(formData.questionType === "mcq_single" || formData.questionType === "mcq_multiple") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Answer Options</Label>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
              </div>
              
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {formData.questionType === "mcq_single" ? (
                      <RadioGroup 
                        value={option.isCorrect ? index.toString() : ""} 
                        onValueChange={() => handleOptionChange(index, "isCorrect", true)}
                      >
                        <RadioGroupItem value={index.toString()} />
                      </RadioGroup>
                    ) : (
                      <Checkbox 
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => handleOptionChange(index, "isCorrect", !!checked)}
                      />
                    )}
                  </div>
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, "text", e.target.value)}
                    className={option.isCorrect ? "border-emerald-500 bg-emerald-50" : ""}
                    data-testid={`input-option-${index}`}
                  />
                  {formData.options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {formData.questionType === "mcq_single" 
                  ? "Select the radio button next to the correct answer" 
                  : "Check all correct answers"}
              </p>
            </div>
          )}

          {formData.questionType === "true_false" && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <RadioGroup 
                value={formData.correctAnswer} 
                onValueChange={(v) => setFormData({ ...formData, correctAnswer: v })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true">True</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false">False</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {(formData.questionType === "numerical" || formData.questionType === "short_answer") && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Input 
                placeholder="Enter correct answer"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                data-testid="input-correct-answer"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Explanation / Solution</Label>
            <Textarea 
              placeholder="Explain the answer step by step..."
              className="min-h-[100px]"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              data-testid="input-explanation"
            />
          </div>

          <div className="space-y-2">
            <Label>Hint (Optional)</Label>
            <Input 
              placeholder="Give a hint without revealing the answer"
              value={formData.hint}
              onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
              data-testid="input-hint"
            />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={level.color}>{level.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marks</Label>
              <Input 
                type="number"
                min="1"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 0 })}
                data-testid="input-marks"
              />
            </div>

            </div>
        </TabsContent>
      </Tabs>

      {showPreview && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Question Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{QUESTION_TYPES.find(t => t.value === formData.questionType)?.label}</Badge>
              <Badge className={DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty)?.color}>
                {DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty)?.label}
              </Badge>
              <Badge variant="secondary">{formData.marks} marks</Badge>
            </div>
            <p className="font-medium">{formData.questionText || "No question text entered"}</p>
            {formData.imageUrl && <img src={formData.imageUrl} alt="Question" className="max-w-xs rounded" />}
            {(formData.questionType.startsWith("mcq") || formData.questionType === "true_false") && (
              <div className="space-y-2">
                {formData.options.filter(o => o.text).map((option, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded border ${option.isCorrect ? "bg-emerald-50 border-emerald-300" : "bg-white"}`}
                  >
                    {String.fromCharCode(65 + i)}. {option.text}
                    {option.isCorrect && <span className="ml-2 text-emerald-600 text-sm">(Correct)</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
          <Eye className="w-4 h-4 mr-2" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFormData({
            ...formData,
            questionText: "",
            options: [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
            correctAnswer: "",
            explanation: "",
            hint: "",
            imageUrl: "",
            audioUrl: "",
          })}>
            Clear
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createQuestionMutation.isPending}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
            data-testid="button-save-question"
          >
            <Save className="w-4 h-4 mr-2" />
            {createQuestionMutation.isPending ? "Saving..." : "Save Question"}
          </Button>
        </div>
      </div>
    </div>
  );
}
