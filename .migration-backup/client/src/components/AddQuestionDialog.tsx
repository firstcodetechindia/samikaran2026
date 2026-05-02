import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCreateQuestion } from "@/hooks/use-exams";
import { Plus, Loader2, Mic, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GenerateQuestionsDialog } from "./GenerateQuestionsDialog";

const formSchema = z.object({
  questionText: z.string().min(5, "Question text must be at least 5 chars"),
  option1: z.string().min(1, "Option 1 required"),
  option2: z.string().min(1, "Option 2 required"),
  option3: z.string().optional(),
  option4: z.string().optional(),
  correctOptionIndex: z.string(),
  marks: z.coerce.number().min(1).default(4),
  type: z.enum(["mcq", "text", "image_based"]).default("mcq"),
  // Voice answer fields
  isVoiceEnabled: z.boolean().default(false),
  spokenAnswerFormat: z.enum(["one_word", "short_explanation", "formula_term"]).optional(),
  voiceEvaluationMethod: z.enum(["exact_match", "keyword_match", "semantic_match"]).optional(),
  referenceAnswer: z.string().optional(),
  acceptedVariations: z.string().optional(), // Comma-separated
  voiceKeywords: z.string().optional(), // Comma-separated
  confidenceThreshold: z.number().min(0).max(100).default(70),
  maxRecordingDuration: z.number().min(10).max(120).default(60),
  allowTextFallback: z.boolean().default(true),
});

export function AddQuestionDialog({ examId }: { examId: number }) {
  const [open, setOpen] = useState(false);
  const [voiceConfigOpen, setVoiceConfigOpen] = useState(false);
  const { mutate, isPending } = useCreateQuestion();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correctOptionIndex: "0",
      marks: 4,
      type: "mcq",
      isVoiceEnabled: false,
      spokenAnswerFormat: undefined,
      voiceEvaluationMethod: undefined,
      referenceAnswer: "",
      acceptedVariations: "",
      voiceKeywords: "",
      confidenceThreshold: 70,
      maxRecordingDuration: 60,
      allowTextFallback: true,
    },
  });

  const isVoiceEnabled = form.watch("isVoiceEnabled");
  const questionType = form.watch("type");

  // Voice mode cannot be enabled for MCQ questions
  const canEnableVoice = questionType !== "mcq";

  function onSubmit(values: z.infer<typeof formSchema>) {
    const options = [values.option1, values.option2, values.option3, values.option4].filter(Boolean) as string[];
    const correctIndex = parseInt(values.correctOptionIndex);
    
    if (values.type === "mcq" && correctIndex >= options.length) {
      form.setError("correctOptionIndex", { message: "Invalid correct option selected" });
      return;
    }

    // Validate voice configuration if enabled
    if (values.isVoiceEnabled) {
      if (!values.spokenAnswerFormat) {
        toast({ title: "Error", description: "Please select a spoken answer format", variant: "destructive" });
        return;
      }
      if (!values.voiceEvaluationMethod) {
        toast({ title: "Error", description: "Please select an evaluation method", variant: "destructive" });
        return;
      }
      if (!values.referenceAnswer?.trim()) {
        toast({ title: "Error", description: "Reference answer is required for voice questions", variant: "destructive" });
        return;
      }
    }

    const content = {
      question: values.questionText,
      options: values.type === "mcq" ? options : [],
      correct: values.type === "mcq" ? options[correctIndex] : values.referenceAnswer || "",
    };

    // Build voice configuration
    const voiceConfig = values.isVoiceEnabled ? {
      isVoiceEnabled: true,
      spokenAnswerFormat: values.spokenAnswerFormat,
      voiceEvaluationMethod: values.voiceEvaluationMethod,
      referenceAnswer: values.referenceAnswer,
      acceptedVariations: values.acceptedVariations?.split(",").map(v => v.trim()).filter(Boolean) || [],
      voiceKeywords: values.voiceKeywords?.split(",").map(v => v.trim()).filter(Boolean) || [],
      confidenceThreshold: values.confidenceThreshold,
      maxRecordingDuration: values.maxRecordingDuration,
      allowTextFallback: values.allowTextFallback,
    } : {
      isVoiceEnabled: false,
    };

    mutate({
      examId,
      type: values.type,
      marks: values.marks,
      content: content,
      negativeMarks: 0,
      ...voiceConfig,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setVoiceConfigOpen(false);
        toast({ title: "Success", description: "Question added successfully" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="flex gap-2">
      <GenerateQuestionsDialog examId={examId} />
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-add-manually">
            <Plus className="w-4 h-4" /> Add Manually
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Question</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Question Type Selection */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Disable voice for MCQ
                        if (value === "mcq") {
                          form.setValue("isVoiceEnabled", false);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-question-type">
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                        <SelectItem value="text">Text / Theory</SelectItem>
                        <SelectItem value="image_based">Image Based</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your question here..." 
                        {...field} 
                        data-testid="input-question-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MCQ Options - only show for MCQ type */}
              {questionType === "mcq" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="option1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option 1</FormLabel>
                          <FormControl><Input {...field} data-testid="input-option-1" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="option2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option 2</FormLabel>
                          <FormControl><Input {...field} data-testid="input-option-2" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="option3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option 3 (Optional)</FormLabel>
                          <FormControl><Input {...field} data-testid="input-option-3" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="option4"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option 4 (Optional)</FormLabel>
                          <FormControl><Input {...field} data-testid="input-option-4" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="correctOptionIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-correct-option">
                              <SelectValue placeholder="Select correct option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Option 1</SelectItem>
                            <SelectItem value="1">Option 2</SelectItem>
                            <SelectItem value="2">Option 3</SelectItem>
                            <SelectItem value="3">Option 4</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-marks" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />

              {/* Voice Answer Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-violet-600" />
                    <span className="font-medium">Enable Voice Answer</span>
                    {!canEnableVoice && (
                      <Badge variant="outline" className="text-xs">Not available for MCQ</Badge>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="isVoiceEnabled"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canEnableVoice}
                            data-testid="switch-voice-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Voice Configuration - Collapsible */}
                {isVoiceEnabled && canEnableVoice && (
                  <Collapsible open={voiceConfigOpen} onOpenChange={setVoiceConfigOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full justify-between p-3 bg-violet-50 hover:bg-violet-100"
                        data-testid="button-voice-config-toggle"
                      >
                        <span className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Voice Configuration
                        </span>
                        {voiceConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg bg-gray-50">
                      {/* Spoken Answer Format */}
                      <FormField
                        control={form.control}
                        name="spokenAnswerFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spoken Answer Format *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-spoken-format">
                                  <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="one_word">One-word / Numeric</SelectItem>
                                <SelectItem value="short_explanation">Short Explanation</SelectItem>
                                <SelectItem value="formula_term">Formula / Term Explanation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>How students should speak their answer</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Evaluation Method */}
                      <FormField
                        control={form.control}
                        name="voiceEvaluationMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Evaluation Method *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-evaluation-method">
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="exact_match">Exact Match (numbers, units, terms)</SelectItem>
                                <SelectItem value="keyword_match">Keyword Match</SelectItem>
                                <SelectItem value="semantic_match">Semantic / Concept Match (AI-assisted)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>How the spoken answer will be evaluated</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Reference Answer */}
                      <FormField
                        control={form.control}
                        name="referenceAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference Answer *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter the expected answer..." 
                                {...field} 
                                data-testid="input-reference-answer"
                              />
                            </FormControl>
                            <FormDescription>The correct answer students should speak</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Accepted Variations */}
                      <FormField
                        control={form.control}
                        name="acceptedVariations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accepted Variations (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ten, 10, Ten (comma-separated)" 
                                {...field} 
                                data-testid="input-accepted-variations"
                              />
                            </FormControl>
                            <FormDescription>Alternative acceptable answers</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Keywords */}
                      <FormField
                        control={form.control}
                        name="voiceKeywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Concepts / Keywords</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="photosynthesis, chlorophyll, sunlight (comma-separated)" 
                                {...field} 
                                data-testid="input-voice-keywords"
                              />
                            </FormControl>
                            <FormDescription>Keywords to match in student's response</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Confidence Threshold */}
                      <FormField
                        control={form.control}
                        name="confidenceThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Confidence Threshold</FormLabel>
                              <span className="text-sm text-muted-foreground">{field.value}%</span>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                                data-testid="slider-confidence"
                              />
                            </FormControl>
                            <FormDescription>Minimum confidence score to accept answer</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Max Recording Duration */}
                      <FormField
                        control={form.control}
                        name="maxRecordingDuration"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between">
                              <FormLabel>Max Recording Duration</FormLabel>
                              <span className="text-sm text-muted-foreground">{field.value}s</span>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                min={10}
                                max={120}
                                step={5}
                                className="w-full"
                                data-testid="slider-duration"
                              />
                            </FormControl>
                            <FormDescription>Maximum seconds students can record</FormDescription>
                          </FormItem>
                        )}
                      />

                      {/* Text Fallback */}
                      <FormField
                        control={form.control}
                        name="allowTextFallback"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Allow Text Fallback</FormLabel>
                              <FormDescription>Allow text input if microphone fails</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-text-fallback"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-question">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Question
                </Button>
              </div>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
