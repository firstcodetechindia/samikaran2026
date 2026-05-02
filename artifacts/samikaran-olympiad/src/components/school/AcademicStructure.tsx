import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  GraduationCap, BookOpen, FileText, Plus, Pencil, Trash2,
  ChevronRight, Layers, Hash, ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle, Eye
} from "lucide-react";

interface SchoolClass {
  id: number;
  name: string;
  gradeNumber: number;
  section: string;
}

interface SchoolSubject {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface SchoolChapter {
  id: number;
  subjectId: number;
  name: string;
  chapterNumber: number;
  description: string;
  syllabusText: string;
  syllabusPdfUrl: string;
  pdfProcessingStatus: string;
  difficultyLevel: string;
  learningObjectives: any;
  conceptTags: string[];
  extractedConcepts: any;
}

export default function AcademicStructure() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SchoolSubject | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", gradeNumber: 1, section: "A" });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", description: "" });
  const [newChapter, setNewChapter] = useState({ name: "", chapterNumber: 1, description: "", syllabusText: "", difficultyLevel: "medium" });
  const [uploadingChapterId, setUploadingChapterId] = useState<number | null>(null);
  const [viewingSyllabus, setViewingSyllabus] = useState<SchoolChapter | null>(null);

  const { data: classes = [], isLoading: classesLoading } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/my-school/classes"],
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/my-school/subjects"],
  });

  const chaptersUrl = selectedSubject ? `/api/school/my-school/chapters?subjectId=${selectedSubject.id}` : "/api/school/my-school/chapters";
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<SchoolChapter[]>({
    queryKey: [chaptersUrl],
    enabled: !!selectedSubject,
  });

  const addClassMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/school/my-school/classes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/my-school/classes"] });
      setShowAddClass(false);
      setNewClass({ name: "", gradeNumber: 1, section: "A" });
      toast({ title: "Class Added", description: "New class created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/school/my-school/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/my-school/classes"] });
      toast({ title: "Deleted", description: "Class removed" });
    },
  });

  const addSubjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/school/my-school/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/my-school/subjects"] });
      setShowAddSubject(false);
      setNewSubject({ name: "", code: "", description: "" });
      toast({ title: "Subject Added", description: "New subject created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/school/my-school/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/my-school/subjects"] });
      setSelectedSubject(null);
      toast({ title: "Deleted", description: "Subject removed" });
    },
  });

  const addChapterMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/school/my-school/chapters", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [chaptersUrl] });
      setShowAddChapter(false);
      setNewChapter({ name: "", chapterNumber: 1, description: "", syllabusText: "", difficultyLevel: "medium" });
      toast({ title: "Chapter Added", description: "New chapter created successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/school/my-school/chapters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [chaptersUrl] });
      toast({ title: "Deleted", description: "Chapter removed" });
    },
  });

  async function handlePdfUpload(chapterId: number, file: File) {
    setUploadingChapterId(chapterId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const storedUser = localStorage.getItem("samikaran_user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const res = await fetch(`/api/school/my-school/chapters/${chapterId}/upload-pdf`, {
        method: "POST",
        headers: {
          "x-user-id": user?.id?.toString() || "",
          "x-user-type": user?.loginType || "school",
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      queryClient.invalidateQueries({ queryKey: [chaptersUrl] });
      toast({ title: "PDF Processed", description: `Extracted ${data.extractedTextLength} characters. ${data.concepts?.length || 0} concepts identified.` });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingChapterId(null);
    }
  }

  if (selectedSubject) {
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSubject(null)} data-testid="button-back-subjects">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Subjects
          </Button>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {selectedSubject.name} — Chapters
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{chapters.length} chapter(s)</p>
          <Dialog open={showAddChapter} onOpenChange={setShowAddChapter}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-chapter"><Plus className="w-4 h-4 mr-1" /> Add Chapter</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Chapter</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Chapter Name</Label>
                  <Input value={newChapter.name} onChange={e => setNewChapter(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Number Systems" data-testid="input-chapter-name" />
                </div>
                <div>
                  <Label>Chapter Number</Label>
                  <Input type="number" value={newChapter.chapterNumber} onChange={e => setNewChapter(p => ({ ...p, chapterNumber: parseInt(e.target.value) || 1 }))} data-testid="input-chapter-number" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newChapter.description} onChange={e => setNewChapter(p => ({ ...p, description: e.target.value }))} placeholder="Chapter description..." data-testid="input-chapter-description" />
                </div>
                <div>
                  <Label>Difficulty Level</Label>
                  <Select value={newChapter.difficultyLevel} onValueChange={v => setNewChapter(p => ({ ...p, difficultyLevel: v }))}>
                    <SelectTrigger data-testid="select-chapter-difficulty"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Syllabus Notes (Optional)</Label>
                  <Textarea value={newChapter.syllabusText} onChange={e => setNewChapter(p => ({ ...p, syllabusText: e.target.value }))} placeholder="Key topics, formulas, concepts..." rows={4} data-testid="input-chapter-syllabus" />
                </div>
                <Button
                  className="w-full"
                  disabled={!newChapter.name || addChapterMutation.isPending}
                  onClick={() => addChapterMutation.mutate({ ...newChapter, subjectId: selectedSubject.id })}
                  data-testid="button-save-chapter"
                >
                  {addChapterMutation.isPending ? "Saving..." : "Add Chapter"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {chaptersLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Card key={i} className="animate-pulse border-0 shadow-md"><CardContent className="p-4"><div className="h-4 bg-muted rounded w-2/3" /></CardContent></Card>)}
          </div>
        ) : chapters.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No chapters yet. Add your first chapter to start building the syllabus.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chapters.map((ch, idx) => (
              <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid={`card-chapter-${ch.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                          {ch.chapterNumber}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{ch.name}</h4>
                          {ch.description && <p className="text-sm text-muted-foreground mt-0.5">{ch.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="outline" className="text-xs">{ch.difficultyLevel || "medium"}</Badge>
                            {ch.pdfProcessingStatus === "completed" && (
                              <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> PDF Processed
                              </Badge>
                            )}
                            {ch.pdfProcessingStatus === "processing" && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing...
                              </Badge>
                            )}
                            {ch.pdfProcessingStatus === "failed" && (
                              <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                                <AlertCircle className="w-3 h-3 mr-1" /> OCR Failed
                              </Badge>
                            )}
                            {ch.syllabusText && !ch.syllabusPdfUrl && <Badge variant="secondary" className="text-xs">Has Syllabus</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePdfUpload(ch.id, file);
                                  e.target.value = "";
                                }}
                                disabled={uploadingChapterId === ch.id}
                                data-testid={`input-upload-pdf-${ch.id}`}
                              />
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-muted transition-colors">
                                {uploadingChapterId === ch.id ? (
                                  <><Loader2 className="w-3 h-3 animate-spin" /> Processing PDF...</>
                                ) : (
                                  <><Upload className="w-3 h-3" /> Upload PDF</>
                                )}
                              </span>
                            </label>
                            {ch.syllabusText && (
                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setViewingSyllabus(ch)} data-testid={`button-view-syllabus-${ch.id}`}>
                                <Eye className="w-3 h-3 mr-1" /> View Extracted Text
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteChapterMutation.mutate(ch.id)} data-testid={`button-delete-chapter-${ch.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={!!viewingSyllabus} onOpenChange={() => setViewingSyllabus(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Extracted Syllabus — {viewingSyllabus?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {viewingSyllabus?.extractedConcepts && Array.isArray(viewingSyllabus.extractedConcepts) && viewingSyllabus.extractedConcepts.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Key Concepts</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingSyllabus.extractedConcepts.map((c: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold">Extracted Text</Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                  {viewingSyllabus?.syllabusText || "No text extracted yet."}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Classes
            </h3>
            <Dialog open={showAddClass} onOpenChange={setShowAddClass}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-class"><Plus className="w-4 h-4 mr-1" /> Add Class</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Class Name</Label>
                    <Input value={newClass.name} onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Class 10" data-testid="input-class-name" />
                  </div>
                  <div>
                    <Label>Grade Number</Label>
                    <Input type="number" min={1} max={12} value={newClass.gradeNumber} onChange={e => setNewClass(p => ({ ...p, gradeNumber: parseInt(e.target.value) || 1 }))} data-testid="input-grade-number" />
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Input value={newClass.section} onChange={e => setNewClass(p => ({ ...p, section: e.target.value }))} placeholder="A" data-testid="input-section" />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newClass.name || addClassMutation.isPending}
                    onClick={() => addClassMutation.mutate(newClass)}
                    data-testid="button-save-class"
                  >
                    {addClassMutation.isPending ? "Saving..." : "Add Class"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {classesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Card key={i} className="animate-pulse border-0 shadow-sm"><CardContent className="p-3"><div className="h-4 bg-muted rounded w-1/2" /></CardContent></Card>)}
            </div>
          ) : classes.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <GraduationCap className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No classes added yet. Start by adding your school classes.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <Card key={cls.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${selectedClass?.id === cls.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedClass(cls)} data-testid={`card-class-${cls.id}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                        {cls.gradeNumber}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">Section {cls.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteClassMutation.mutate(cls.id); }} data-testid={`button-delete-class-${cls.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Subjects
            </h3>
            <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-subject"><Plus className="w-4 h-4 mr-1" /> Add Subject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Subject Name</Label>
                    <Input value={newSubject.name} onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Mathematics" data-testid="input-subject-name" />
                  </div>
                  <div>
                    <Label>Subject Code</Label>
                    <Input value={newSubject.code} onChange={e => setNewSubject(p => ({ ...p, code: e.target.value }))} placeholder="e.g., MATH" data-testid="input-subject-code" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newSubject.description} onChange={e => setNewSubject(p => ({ ...p, description: e.target.value }))} placeholder="Subject description..." data-testid="input-subject-description" />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!newSubject.name || addSubjectMutation.isPending}
                    onClick={() => addSubjectMutation.mutate(newSubject)}
                    data-testid="button-save-subject"
                  >
                    {addSubjectMutation.isPending ? "Saving..." : "Add Subject"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {subjectsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Card key={i} className="animate-pulse border-0 shadow-sm"><CardContent className="p-3"><div className="h-4 bg-muted rounded w-1/2" /></CardContent></Card>)}
            </div>
          ) : subjects.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No subjects added yet. Add subjects for your school.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {subjects.map((subj) => (
                <Card key={subj.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSubject(subj)} data-testid={`card-subject-${subj.id}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{subj.name}</p>
                        {subj.code && <p className="text-xs text-muted-foreground">{subj.code}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSubjectMutation.mutate(subj.id); }} data-testid={`button-delete-subject-${subj.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
