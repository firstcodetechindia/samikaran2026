import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, ChevronLeft, ChevronRight, Check, BookOpen, Calendar, Settings, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { INDIAN_LANGUAGES } from "@shared/constants";
import { validateExamLifecycleDates } from "@shared/exam-lifecycle";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const olympiadFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  categoryId: z.number().nullable().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  registrationOpenDate: z.string().optional(),
  registrationCloseDate: z.string().optional(),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  maxQuestions: z.number().min(1).default(50),
  negativeMarking: z.boolean().default(false),
  negativeMarkingWrongCount: z.number().min(1).default(3), // How many wrong answers trigger deduction
  negativeMarkingDeduction: z.number().min(1).default(1), // Marks to deduct
  proctoring: z.boolean().default(false),
  warningLanguages: z.array(z.string()).default(["en", "hi"]), // Languages for proctoring warnings
  difficultyLevel: z.string().default("medium"), // Difficulty level for all questions
  mcqCount: z.number().min(0).default(0),
  trueFalseCount: z.number().min(0).default(0),
  imageBasedCount: z.number().min(0).default(0),
  isVisible: z.boolean().default(false),
  status: z.string().default("draft"),
  participationFee: z.number().min(0).default(0),
  participantLimit: z.number().nullable().optional(),
  isParticipantLimited: z.boolean().default(false),
  classCategory: z.string().nullable().optional(),
  minClass: z.number().nullable().optional(),
  maxClass: z.number().nullable().optional(),
  maxAge: z.number().nullable().optional(),
  resultDeclarationDate: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  enableRandomDistribution: z.boolean().default(false),
  questionsPerStudent: z.number().nullable().optional(),
  shuffleQuestionOrder: z.boolean().default(true),
  shuffleOptionOrder: z.boolean().default(true),
});

type OlympiadFormData = z.infer<typeof olympiadFormSchema>;

interface OlympiadCategory {
  id: number;
  name: string;
  slug: string;
}

interface CreateOlympiadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const steps = [
  { id: 1, title: "Basic Info", icon: BookOpen },
  { id: 2, title: "Schedule", icon: Calendar },
  { id: 3, title: "Settings", icon: Settings },
  { id: 4, title: "Access", icon: Eye },
];

const subjects = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Computer Science",
  "Social Studies",
  "General Knowledge",
  "Reasoning",
  "Economics",
  "History",
  "Geography",
];

const classCategories = [
  { value: "primary", label: "Primary (1-5)" },
  { value: "middle", label: "Middle (6-8)" },
  { value: "secondary", label: "Secondary (9-10)" },
  { value: "senior", label: "Senior Secondary (11-12)" },
  { value: "all", label: "All Classes" },
];

export default function CreateOlympiadModal({ open, onOpenChange, onSuccess }: CreateOlympiadModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
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

  const { data: categories = [] } = useQuery<OlympiadCategory[]>({
    queryKey: ["/api/sysctrl/olympiad-categories"],
    enabled: open,
  });

  const form = useForm<OlympiadFormData>({
    resolver: zodResolver(olympiadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      categoryId: null,
      startTime: "",
      endTime: "",
      registrationOpenDate: "",
      registrationCloseDate: "",
      durationMinutes: 60,
      totalMarks: 100,
      maxQuestions: 50,
      negativeMarking: false,
      negativeMarkingWrongCount: 3,
      negativeMarkingDeduction: 1,
      proctoring: false,
      warningLanguages: ["en", "hi"],
      difficultyLevel: "medium",
      mcqCount: 0,
      trueFalseCount: 0,
      imageBasedCount: 0,
      isVisible: false,
      status: "draft",
      participationFee: 0,
      participantLimit: null,
      isParticipantLimited: false,
      classCategory: null,
      minClass: null,
      maxClass: null,
      maxAge: null,
      resultDeclarationDate: "",
      imageUrl: "",
      enableRandomDistribution: false,
      questionsPerStudent: null,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: OlympiadFormData) => {
      const payload = {
        ...data,
        createdBy: "admin",
        totalQuestions: (data.mcqCount || 0) + (data.trueFalseCount || 0) + (data.imageBasedCount || 0),
      };
      return await apiRequest("POST", "/api/exams", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Olympiad created successfully" });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create olympiad", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(1);
    form.reset();
  };

  const [dateValidationErrors, setDateValidationErrors] = useState<string[]>([]);

  const validateStep = async () => {
    let fieldsToValidate: (keyof OlympiadFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["title", "subject"];
        break;
      case 2:
        fieldsToValidate = ["startTime", "endTime"];
        break;
      case 3:
        fieldsToValidate = ["durationMinutes", "totalMarks"];
        break;
      case 4:
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    
    if (!result) {
      const invalidFields = fieldsToValidate.filter(f => form.formState.errors[f]);
      triggerShake(invalidFields);
    } else {
      setErrorFields(new Set());
    }

    if (currentStep === 2 && result) {
      const values = form.getValues();
      const dateValidation = validateExamLifecycleDates({
        registrationOpenDate: values.registrationOpenDate || null,
        registrationCloseDate: values.registrationCloseDate || null,
        startTime: values.startTime,
        endTime: values.endTime,
        resultDeclarationDate: values.resultDeclarationDate || null,
      });
      
      if (!dateValidation.valid) {
        setDateValidationErrors(dateValidation.errors);
        return false;
      } else {
        setDateValidationErrors([]);
      }
    }
    
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: OlympiadFormData) => {
    createMutation.mutate(data);
  };

  const progress = (currentStep / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Olympiad</DialogTitle>
          <DialogDescription>
            Set up a new olympiad examination in {steps.length} steps
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id === currentStep
                    ? "text-violet-600"
                    : step.id < currentStep
                    ? "text-emerald-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id === currentStep
                      ? "bg-violet-100 text-violet-600"
                      : step.id < currentStep
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className="hidden sm:inline text-sm">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody className="pr-4">
              <div className="space-y-4">
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Olympiad Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., National Mathematics Olympiad 2026" 
                          {...field} 
                          className={getInputClass("title")}
                          data-testid="input-olympiad-title" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={getInputClass("subject")} data-testid="select-olympiad-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (optional)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-olympiad-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the olympiad..."
                          className="resize-none"
                          {...field}
                          data-testid="input-olympiad-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {dateValidationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {dateValidationErrors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                    <strong>Date Hierarchy:</strong> Registration Open → Registration Close → Exam Start → Exam End → Result Declaration
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationOpenDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Opens</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-olympiad-reg-open" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationCloseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Closes</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-olympiad-reg-close" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Start *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            className={getInputClass("startTime")}
                            data-testid="input-olympiad-start" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam End *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            className={getInputClass("endTime")}
                            data-testid="input-olympiad-end" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="resultDeclarationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Declaration Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          data-testid="input-olympiad-result-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="480"
                            {...field}
                            className={getInputClass("durationMinutes")}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-olympiad-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            className={getInputClass("totalMarks")}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-olympiad-marks"
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription className="text-xs">Total marks will be auto-calculated from question marks</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Questions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-max-questions"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Maximum questions allowed in this olympiad</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-700">Question Distribution</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="mcqCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MCQ</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-mcq-count"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trueFalseCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>True/False</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-tf-count"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageBasedCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image-Based</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-image-count"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Negative Marking</Label>
                    <p className="text-sm text-gray-500">Deduct marks for wrong answers</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="negativeMarking"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-negative-marking" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("negativeMarking") && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
                    <p className="text-sm text-amber-800 font-medium">Negative Marking Configuration</p>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="negativeMarkingWrongCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wrong Answers Count</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-wrong-count"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">How many wrong answers trigger deduction</FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="negativeMarkingDeduction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marks to Deduct</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-deduction-marks"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Marks deducted when threshold reached</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-amber-700">
                      Example: {form.watch("negativeMarkingWrongCount")} wrong answers = {form.watch("negativeMarkingDeduction")} mark(s) deduction
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Enable Proctoring</Label>
                    <p className="text-sm text-gray-500">Camera monitoring during exam</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="proctoring"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-proctoring" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("proctoring") && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                    <div>
                      <Label className="text-purple-800 font-medium">Warning Languages</Label>
                      <p className="text-sm text-purple-600">Select languages for proctoring voice warnings</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="warningLanguages"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {INDIAN_LANGUAGES.map((lang) => (
                              <label
                                key={lang.code}
                                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                                  field.value?.includes(lang.code)
                                    ? "bg-purple-100 border-purple-400"
                                    : "bg-white border-gray-200 hover:border-purple-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(lang.code)}
                                  onChange={(e) => {
                                    const current = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...current, lang.code]);
                                    } else {
                                      field.onChange(current.filter((c: string) => c !== lang.code));
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-600 rounded"
                                  data-testid={`checkbox-lang-${lang.code}`}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-800">{lang.name}</span>
                                  <span className="text-xs text-gray-500">{lang.nativeName}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-xs text-purple-700">
                      Selected: {(form.watch("warningLanguages") || []).length} language(s)
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="difficultyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <FormDescription>Difficulty level for all questions in this olympiad</FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-difficulty-level">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very_easy">Very Easy</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                          <SelectItem value="olympiad">Olympiad Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <div>
                    <Label className="text-blue-800 font-medium">Random Question Distribution</Label>
                    <p className="text-sm text-blue-600">Securely randomize questions for each student</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">Enable Random Distribution</Label>
                      <p className="text-xs text-gray-500">Each student gets a random subset of questions</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="enableRandomDistribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-random-distribution"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("enableRandomDistribution") && (
                    <FormField
                      control={form.control}
                      name="questionsPerStudent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Questions Per Student</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Leave empty for all questions"
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              data-testid="input-questions-per-student"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Number of questions each student will receive. Leave empty for all questions.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <Label className="text-gray-700 text-sm">Shuffle Question Order</Label>
                        <p className="text-xs text-gray-500">Randomize question sequence</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="shuffleQuestionOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-shuffle-questions"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <Label className="text-gray-700 text-sm">Shuffle Option Order</Label>
                        <p className="text-xs text-gray-500">Randomize MCQ options</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="shuffleOptionOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-shuffle-options"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-blue-700">
                    Uses cryptographically secure Fisher-Yates shuffle algorithm. Questions are locked when exam starts and remain consistent on refresh.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Visibility</Label>
                    <p className="text-sm text-gray-500">Make olympiad visible to students</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-visibility" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-olympiad-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participationFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participation Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-participation-fee"
                        />
                      </FormControl>
                      <FormDescription>Enter 0 for free participation</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-gray-700">Limit Participants</Label>
                    <p className="text-sm text-gray-500">Set maximum number of participants</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isParticipantLimited"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-participant-limit" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("isParticipantLimited") && (
                  <FormField
                    control={form.control}
                    name="participantLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            data-testid="input-participant-limit"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="classCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Category</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-class-category">
                            <SelectValue placeholder="Select class category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No restriction</SelectItem>
                          {classCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="minClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Class</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            data-testid="input-min-class"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Class</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            data-testid="input-max-class"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            max="25"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            data-testid="input-max-age"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
              </div>
            </DialogBody>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  disabled={createMutation.isPending}
                  data-testid="button-create-olympiad-submit"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Olympiad
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
