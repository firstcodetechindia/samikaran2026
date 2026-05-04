import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Eye, Trash2, Save, X, Search, Filter,
  CheckCircle, Clock, Archive, FileText, Globe, Settings,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Copy, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/lazy-rich-text-editor";
import type { OlympiadCategory, OlympiadPageContent } from "@shared/schema";

interface FAQItem {
  question: string;
  answer: string;
}

interface CustomSection {
  title: string;
  content: string;
}

interface OlympiadWithContent extends OlympiadCategory {
  pageContent?: OlympiadPageContent;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  live: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  archived: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const statusIcons: Record<string, any> = {
  draft: FileText,
  live: CheckCircle,
  scheduled: Clock,
  archived: Archive,
};

export default function OlympiadManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedOlympiad, setSelectedOlympiad] = useState<OlympiadWithContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    seo: true,
    hero: true,
    overview: true,
    whyParticipate: true,
    eligibility: true,
    syllabus: true,
    dates: true,
    registration: true,
    preparation: true,
    awards: true,
    faq: false,
    custom: false,
  });

  const [formData, setFormData] = useState<Partial<OlympiadPageContent & { categoryName?: string; categorySlug?: string }>>({});
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);

  const { data: olympiads, isLoading } = useQuery<OlympiadWithContent[]>({
    queryKey: ["/api/admin/olympiad-management"],
  });

  // Fetch exams to find the exam slug for preview
  const { data: exams } = useQuery<{ id: number; slug: string; title: string; categoryId: number }[]>({
    queryKey: ["/api/public/olympiads"],
  });

  const { data: pageContent, isLoading: isLoadingContent } = useQuery<OlympiadPageContent>({
    queryKey: ["/api/admin/olympiad-content", selectedOlympiad?.id],
    enabled: !!selectedOlympiad?.id,
  });

  // Find an exam for the selected category (for preview)
  const categoryExam = selectedOlympiad ? exams?.find(e => e.categoryId === selectedOlympiad.id) : null;

  useEffect(() => {
    if (pageContent) {
      setFormData({
        ...pageContent,
        categoryName: selectedOlympiad?.name,
        categorySlug: selectedOlympiad?.slug,
      });
      setFaqs((pageContent.faqContent as FAQItem[]) || []);
      setCustomSections((pageContent.customSections as CustomSection[]) || []);
    } else if (selectedOlympiad) {
      setFormData({
        categoryId: selectedOlympiad.id,
        categoryName: selectedOlympiad.name,
        categorySlug: selectedOlympiad.slug,
        status: "draft",
        isRegistrationOpen: false,
        registrationButtonText: "Register Now",
      });
      setFaqs([]);
      setCustomSections([]);
    }
  }, [pageContent, selectedOlympiad]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OlympiadPageContent>) => {
      const endpoint = pageContent?.id
        ? `/api/admin/olympiad-content/${pageContent.id}`
        : "/api/admin/olympiad-content";
      const method = pageContent?.id ? "PATCH" : "POST";
      return apiRequest(method, endpoint, {
        ...data,
        faqContent: faqs,
        customSections: customSections,
      });
    },
    onSuccess: () => {
      toast({ title: "Saved successfully", description: "Olympiad content has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/olympiad-management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/olympiad-content", selectedOlympiad?.id] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!pageContent?.id) return;
      return apiRequest("PATCH", `/api/admin/olympiad-content/${pageContent.id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status updated", description: "Olympiad status has been changed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/olympiad-management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/olympiad-content", selectedOlympiad?.id] });
    },
    onError: (error: any) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      return apiRequest("POST", "/api/admin/olympiad-categories", data);
    },
    onSuccess: () => {
      toast({ title: "Created successfully", description: "New olympiad category has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/olympiad-management"] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast({ title: "Error creating", description: error.message, variant: "destructive" });
    },
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const addCustomSection = () => {
    setCustomSections([...customSections, { title: "", content: "" }]);
  };

  const updateCustomSection = (index: number, field: "title" | "content", value: string) => {
    const newSections = [...customSections];
    newSections[index][field] = value;
    setCustomSections(newSections);
  };

  const removeCustomSection = (index: number) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  const filteredOlympiads = olympiads?.filter((o) => {
    const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.pageContent?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = () => {
    if (!selectedOlympiad) return;
    saveMutation.mutate({
      ...formData,
      categoryId: selectedOlympiad.id,
    });
  };

  const SectionHeader = ({ title, section, icon: Icon }: { title: string; section: string; icon: any }) => (
    <CollapsibleTrigger
      className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-violet-500" />
        <span className="font-medium">{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      )}
    </CollapsibleTrigger>
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {!sidebarCollapsed && (
        <Card className="w-80 flex-shrink-0 flex flex-col transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Olympiads</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowCreateModal(true)} data-testid="button-create-olympiad">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSidebarCollapsed(true)}
                  data-testid="button-collapse-sidebar"
                  title="Collapse sidebar for full-page editing"
                  className="px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                  data-testid="input-search-olympiad"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-24 h-9" data-testid="select-status-filter">
                  <Filter className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredOlympiads?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No olympiads found</div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredOlympiads?.map((olympiad) => {
                  const StatusIcon = statusIcons[olympiad.pageContent?.status || "draft"];
                  return (
                    <button
                      key={olympiad.id}
                      onClick={() => {
                        setSelectedOlympiad(olympiad);
                        setIsEditing(false);
                        setIsPreviewMode(false);
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedOlympiad?.id === olympiad.id
                          ? "bg-violet-100 dark:bg-violet-900/30 border-l-4 border-violet-500"
                          : "hover:bg-muted/50"
                      }`}
                      data-testid={`button-select-olympiad-${olympiad.id}`}
                    >
                      <div className="font-medium text-sm truncate">{olympiad.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${statusColors[olympiad.pageContent?.status || "draft"]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {olympiad.pageContent?.status || "draft"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      )}

      {sidebarCollapsed && (
        <Button 
          size="icon" 
          variant="outline" 
          onClick={() => setSidebarCollapsed(false)}
          className="flex-shrink-0 h-10 w-10 self-start"
          data-testid="button-expand-sidebar"
          title="Show olympiad list"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      <div className="flex-1 overflow-hidden">
        {!selectedOlympiad ? (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select an Olympiad</p>
              <p className="text-sm">Choose an olympiad from the list to manage its content</p>
            </div>
          </Card>
        ) : isPreviewMode ? (
          <Card className="h-full overflow-hidden">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Preview: {selectedOlympiad.name}</CardTitle>
                <CardDescription>This is how the page will look to visitors</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPreviewMode(false)} data-testid="button-close-preview">
                  <X className="w-4 h-4 mr-1" />
                  Close Preview
                </Button>
                <Button
                  onClick={() => categoryExam && window.open(`/olympiad/${categoryExam.slug}`, "_blank")}
                  disabled={!categoryExam}
                  data-testid="button-open-live"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Live Page
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              {categoryExam ? (
                <iframe
                  src={`/olympiad/${categoryExam.slug}?preview=true`}
                  className="w-full h-full border-t"
                  title="Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-violet-500/10 to-pink-500/10">
                  <Globe className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No Exam Available</h3>
                  <p className="text-sm text-muted-foreground/80 max-w-md">
                    No exam has been created for this olympiad category yet. Create an exam first to preview the page.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="flex-row items-center justify-between pb-3 flex-shrink-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedOlympiad.name}
                  <Badge variant="outline" className={statusColors[formData.status || "draft"]}>
                    {formData.status || "draft"}
                  </Badge>
                </CardTitle>
                <CardDescription>Manage all content and settings for this olympiad</CardDescription>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsPreviewMode(true)} data-testid="button-preview">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button onClick={() => setIsEditing(true)} data-testid="button-edit-content">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Content
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-content">
                      {saveMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.isRegistrationOpen ?? false}
                          onCheckedChange={(checked) => setFormData({ ...formData, isRegistrationOpen: checked })}
                          disabled={!isEditing}
                          data-testid="switch-registration"
                        />
                        <Label>Registration Open</Label>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-2">
                        <Label>Status:</Label>
                        <Select
                          value={formData.status || "draft"}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="w-32" data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {formData.status === "live" && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </div>

                  <Collapsible open={expandedSections.seo}>
                    <Card>
                      <SectionHeader title="SEO Settings" section="seo" icon={Globe} />
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div className="grid gap-4">
                            <div>
                              <Label>SEO Title</Label>
                              <Input
                                value={formData.seoTitle || ""}
                                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                                placeholder="e.g., Mathematics Olympiad 2024 | Samikaran Olympiad"
                                disabled={!isEditing}
                                data-testid="input-seo-title"
                              />
                            </div>
                            <div>
                              <Label>SEO Description</Label>
                              <Textarea
                                value={formData.seoDescription || ""}
                                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                                placeholder="Brief description for search engines (150-160 characters)"
                                disabled={!isEditing}
                                data-testid="input-seo-description"
                              />
                            </div>
                            <div>
                              <Label>SEO Keywords</Label>
                              <Input
                                value={formData.seoKeywords || ""}
                                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                                placeholder="math olympiad, mathematics competition, student olympiad"
                                disabled={!isEditing}
                                data-testid="input-seo-keywords"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.hero}>
                    <Card>
                      <SectionHeader title="Hero Section" section="hero" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div>
                            <Label>Hero Title</Label>
                            <Input
                              value={formData.heroTitle || ""}
                              onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                              placeholder="e.g., International Mathematics Olympiad"
                              disabled={!isEditing}
                              data-testid="input-hero-title"
                            />
                          </div>
                          <div>
                            <Label>Hero Subtitle</Label>
                            <Textarea
                              value={formData.heroSubtitle || ""}
                              onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                              placeholder="Challenge your mathematical abilities..."
                              disabled={!isEditing}
                              data-testid="input-hero-subtitle"
                            />
                          </div>
                          <div>
                            <Label>Hero Image URL</Label>
                            <Input
                              value={formData.heroImageUrl || ""}
                              onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                              placeholder="https://..."
                              disabled={!isEditing}
                              data-testid="input-hero-image"
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.overview}>
                    <Card>
                      <SectionHeader title="Overview / What is this Olympiad" section="overview" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.overviewContent || ""}
                            onChange={(content) => setFormData({ ...formData, overviewContent: content })}
                            placeholder="Describe what this olympiad is about..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.whyParticipate}>
                    <Card>
                      <SectionHeader title="Why Participate" section="whyParticipate" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.whyParticipateContent || ""}
                            onChange={(content) => setFormData({ ...formData, whyParticipateContent: content })}
                            placeholder="Benefits of participation..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.eligibility}>
                    <Card>
                      <SectionHeader title="Eligibility Criteria" section="eligibility" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.eligibilityContent || ""}
                            onChange={(content) => setFormData({ ...formData, eligibilityContent: content })}
                            placeholder="Who can participate..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.syllabus}>
                    <Card>
                      <SectionHeader title="Syllabus & Exam Pattern" section="syllabus" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.syllabusContent || ""}
                            onChange={(content) => setFormData({ ...formData, syllabusContent: content })}
                            placeholder="Syllabus details and exam pattern..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.dates}>
                    <Card>
                      <SectionHeader title="Important Dates" section="dates" icon={Clock} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.importantDatesContent || ""}
                            onChange={(content) => setFormData({ ...formData, importantDatesContent: content })}
                            placeholder="Timeline and important dates..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.registration}>
                    <Card>
                      <SectionHeader title="Registration Process" section="registration" icon={Settings} />
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Registration Button Text</Label>
                              <Input
                                value={formData.registrationButtonText || ""}
                                onChange={(e) => setFormData({ ...formData, registrationButtonText: e.target.value })}
                                placeholder="Register Now"
                                disabled={!isEditing}
                                data-testid="input-registration-button"
                              />
                            </div>
                            <div>
                              <Label>Registration URL (optional)</Label>
                              <Input
                                value={formData.registrationUrl || ""}
                                onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                                placeholder="/register"
                                disabled={!isEditing}
                                data-testid="input-registration-url"
                              />
                            </div>
                          </div>
                          <RichTextEditor
                            content={formData.registrationProcessContent || ""}
                            onChange={(content) => setFormData({ ...formData, registrationProcessContent: content })}
                            placeholder="How to register..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.preparation}>
                    <Card>
                      <SectionHeader title="Preparation Tips" section="preparation" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.preparationTipsContent || ""}
                            onChange={(content) => setFormData({ ...formData, preparationTipsContent: content })}
                            placeholder="Tips for preparation..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.awards}>
                    <Card>
                      <SectionHeader title="Awards & Recognition" section="awards" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <RichTextEditor
                            content={formData.awardsContent || ""}
                            onChange={(content) => setFormData({ ...formData, awardsContent: content })}
                            placeholder="Awards and recognition details..."
                            minHeight="200px"
                          />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.faq}>
                    <Card>
                      <SectionHeader title="FAQs" section="faq" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {faqs.map((faq, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Question {index + 1}</Label>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFaq(index)}
                                    data-testid={`button-remove-faq-${index}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={faq.question}
                                onChange={(e) => updateFaq(index, "question", e.target.value)}
                                placeholder="Enter question..."
                                disabled={!isEditing}
                                data-testid={`input-faq-question-${index}`}
                              />
                              <Textarea
                                value={faq.answer}
                                onChange={(e) => updateFaq(index, "answer", e.target.value)}
                                placeholder="Enter answer..."
                                disabled={!isEditing}
                                data-testid={`input-faq-answer-${index}`}
                              />
                            </div>
                          ))}
                          {isEditing && (
                            <Button variant="outline" onClick={addFaq} className="w-full" data-testid="button-add-faq">
                              <Plus className="w-4 h-4 mr-1" />
                              Add FAQ
                            </Button>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={expandedSections.custom}>
                    <Card>
                      <SectionHeader title="Custom Sections" section="custom" icon={FileText} />
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {customSections.map((section, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Section {index + 1}</Label>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCustomSection(index)}
                                    data-testid={`button-remove-section-${index}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={section.title}
                                onChange={(e) => updateCustomSection(index, "title", e.target.value)}
                                placeholder="Section title..."
                                disabled={!isEditing}
                                data-testid={`input-section-title-${index}`}
                              />
                              <RichTextEditor
                                content={section.content}
                                onChange={(content) => updateCustomSection(index, "content", content)}
                                placeholder="Section content..."
                                minHeight="150px"
                              />
                            </div>
                          ))}
                          {isEditing && (
                            <Button
                              variant="outline"
                              onClick={addCustomSection}
                              className="w-full"
                              data-testid="button-add-section"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Custom Section
                            </Button>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Olympiad</DialogTitle>
            <DialogDescription>Add a new olympiad category to the system</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createCategoryMutation.mutate({
                name: formData.get("name") as string,
                slug: formData.get("slug") as string,
                description: formData.get("description") as string,
              });
            }}
          >
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Olympiad Name</Label>
                <Input id="name" name="name" placeholder="e.g., Mathematics Olympiad" required data-testid="input-new-name" />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" name="slug" placeholder="e.g., mathematics-olympiad" required data-testid="input-new-slug" />
              </div>
              <div>
                <Label htmlFor="description">Short Description</Label>
                <Textarea id="description" name="description" placeholder="Brief description..." data-testid="input-new-description" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCategoryMutation.isPending} data-testid="button-submit-create">
                {createCategoryMutation.isPending ? "Creating..." : "Create Olympiad"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
