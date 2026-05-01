import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateQuestions } from "@/hooks/use-exams";
import { Sparkles, Loader2, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

const formSchema = z.object({
  topic: z.string().min(3, "Topic is required"),
  count: z.coerce.number().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export function GenerateQuestionsDialog({ examId }: { examId: number }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useGenerateQuestions();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      count: 5,
      difficulty: "medium",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate({
      ...values,
      examId,
    }, {
      onSuccess: (data) => {
        setOpen(false);
        form.reset();
        toast({ 
          title: "AI Generation Complete", 
          description: `Successfully generated ${data.count} questions about ${values.topic}.` 
        });
      },
      onError: (err) => {
        toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-purple-200">
          <Sparkles className="w-4 h-4" /> AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Bot className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">Generate with AI</DialogTitle>
          </div>
          <DialogDescription>
            Use our AI engine to automatically create relevant questions for this exam.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic / Subject Matter</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Organic Chemistry, World War II, Calculus..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
