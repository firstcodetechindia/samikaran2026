import { Helmet } from "react-helmet-async";
import { useExams } from "@/hooks/use-exams";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CreateExamDialog } from "@/components/CreateExamDialog";
import { PremiumCard } from "@/components/ui/card-custom";
import { format } from "date-fns";
import { Users, Clock, FileText, Trash2, Edit2, MoreVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useExamQuestions, useDeleteQuestion } from "@/hooks/use-exams";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

function ExamManagement({ examId }: { examId: number }) {
  const { data: questions, isLoading } = useExamQuestions(examId);
  const { mutate: deleteQuestion } = useDeleteQuestion();

  if (isLoading) return <div className="p-4">Loading questions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Questions ({questions?.length || 0})</h3>
        <AddQuestionDialog examId={examId} />
      </div>
      
      <ScrollArea className="h-[400px] rounded-md border p-4">
        {questions?.length === 0 ? (
           <p className="text-center text-muted-foreground py-10">No questions added yet.</p>
        ) : (
            <div className="space-y-4">
            {questions?.map((q, i) => (
                <div key={q.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex justify-between items-start gap-4">
                    <div>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Q{i + 1}</span>
                    <p className="mt-2 font-medium">{(q.content as any).question}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {(q.content as any).options.map((opt: string, idx: number) => (
                        <div key={idx} className={`text-sm px-2 py-1 rounded ${opt === (q.content as any).correct ? 'bg-green-100 text-green-800' : 'bg-muted/50'}`}>
                            {opt}
                        </div>
                        ))}
                    </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteQuestion(q.id)}>
                    <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                </div>
            ))}
            </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: exams, isLoading } = useExams();
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Exam Management</h1>
            <p className="text-muted-foreground">Create and manage your assessments</p>
          </div>
          <CreateExamDialog />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Exam List */}
            <div className="lg:col-span-2 space-y-4">
                {isLoading ? (
                    <div className="text-center py-12">Loading exams...</div>
                ) : exams?.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No Exams Created</h3>
                        <p className="text-muted-foreground">Create your first exam to get started.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {exams?.map((exam) => (
                            <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExamId(exam.id)}>
                                <TableCell className="font-medium">
                                    {exam.title}
                                    <div className="text-xs text-muted-foreground">{exam.subject}</div>
                                </TableCell>
                                <TableCell>{format(new Date(exam.startTime), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={new Date() > new Date(exam.endTime) ? "secondary" : "default"}>
                                        {new Date() > new Date(exam.endTime) ? "Closed" : "Active"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedExamId(exam.id); }}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Exam Details / Question Management Panel */}
            <div className="bg-card rounded-xl border shadow-sm p-6 h-fit sticky top-24">
                {selectedExamId ? (
                    <div className="space-y-6">
                        <div className="border-b pb-4">
                            <h2 className="text-xl font-bold font-display">
                                {exams?.find(e => e.id === selectedExamId)?.title}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage questions and settings for this exam.
                            </p>
                        </div>
                        <ExamManagement examId={selectedExamId} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-[400px]">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold">Select an Exam</h3>
                        <p className="text-muted-foreground max-w-xs">
                            Click on an exam from the list to manage its questions and view details.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
