import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layout, FileText, Plus, Trash2, Edit, Eye, CheckCircle, Clock, Globe,
  FileEdit, Send, Mail, ExternalLink, GripVertical, ChevronDown, ChevronUp,
  AlertCircle, RefreshCw, Save, X, Type, Image, HelpCircle, List, Grid3X3, Wand2
} from "lucide-react";
import { CMSPageBuilder } from "./CMSPageBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";

interface CmsPage {
  id: number;
  title: string;
  slug: string;
  pageType: string;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  showInFooter: boolean;
  footerOrder: number;
  footerColumn: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CmsSection {
  id: number;
  pageId: number;
  sectionType: string;
  title: string | null;
  content: any;
  displayOrder: number;
  isVisible: boolean;
}

interface CmsFormSubmission {
  id: number;
  formType: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string | null;
  status: string;
  autoReplyStatus: string;
  createdAt: string;
}

const sectionTypeIcons: Record<string, any> = {
  rich_text: Type,
  image: Image,
  faq: HelpCircle,
  gallery: Grid3X3,
  timeline: List,
  card_grid: Grid3X3,
  contact_form: Mail,
};

const sectionTypeLabels: Record<string, string> = {
  rich_text: "Rich Text",
  image: "Image",
  faq: "FAQ Accordion",
  gallery: "Gallery",
  timeline: "Timeline",
  card_grid: "Card Grid",
  contact_form: "Contact Form",
};

const statusColors: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-gray-100 text-gray-700",
};

const formStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-gray-100 text-gray-700",
  replied: "bg-emerald-100 text-emerald-700",
  archived: "bg-gray-200 text-gray-600",
};

export function ContentCMSTab({ toast }: { toast: any }) {
  const [activeSubTab, setActiveSubTab] = useState<"pages" | "submissions">("pages");
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    pageType: "content",
    metaTitle: "",
    metaDescription: "",
    heroTitle: "",
    heroSubtitle: "",
    showInFooter: false,
    footerOrder: 0,
    footerColumn: "company",
  });

  const { data: pages = [], refetch: refetchPages } = useQuery<CmsPage[]>({
    queryKey: ["/api/sysctrl/cms/pages"],
  });

  const { data: pageWithSections, refetch: refetchPageSections } = useQuery<{ page: CmsPage; sections: CmsSection[] }>({
    queryKey: ["/api/sysctrl/cms/pages", selectedPageId],
    enabled: !!selectedPageId,
  });

  const { data: submissions = [], refetch: refetchSubmissions } = useQuery<CmsFormSubmission[]>({
    queryKey: ["/api/sysctrl/cms/submissions"],
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/sysctrl/cms/pages", data),
    onSuccess: () => {
      refetchPages();
      setShowPageDialog(false);
      resetPageForm();
      toast({ title: "Success", description: "Page created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create page", variant: "destructive" });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/sysctrl/cms/pages/${id}`, data),
    onSuccess: () => {
      refetchPages();
      if (selectedPageId) refetchPageSections();
      setShowPageDialog(false);
      setEditingPage(null);
      resetPageForm();
      toast({ title: "Success", description: "Page updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update page", variant: "destructive" });
    },
  });

  const publishPageMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/sysctrl/cms/pages/${id}/publish`),
    onSuccess: () => {
      refetchPages();
      if (selectedPageId) refetchPageSections();
      toast({ title: "Success", description: "Page published" });
    },
  });

  const unpublishPageMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/sysctrl/cms/pages/${id}/unpublish`),
    onSuccess: () => {
      refetchPages();
      if (selectedPageId) refetchPageSections();
      toast({ title: "Success", description: "Page unpublished" });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/sysctrl/cms/pages/${id}`),
    onSuccess: () => {
      refetchPages();
      setSelectedPageId(null);
      toast({ title: "Success", description: "Page deleted" });
    },
  });

  const seedPagesMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/sysctrl/cms/seed"),
    onSuccess: () => {
      refetchPages();
      toast({ title: "Success", description: "Default pages created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create default pages", variant: "destructive" });
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      apiRequest("PATCH", `/api/sysctrl/cms/submissions/${id}`, { status, notes }),
    onSuccess: () => {
      refetchSubmissions();
      toast({ title: "Success", description: "Submission updated" });
    },
  });

  const resetPageForm = () => {
    setPageForm({
      title: "",
      slug: "",
      pageType: "content",
      metaTitle: "",
      metaDescription: "",
      heroTitle: "",
      heroSubtitle: "",
      showInFooter: false,
      footerOrder: 0,
      footerColumn: "company",
    });
  };

  const handleEditPage = (page: CmsPage) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      slug: page.slug,
      pageType: page.pageType,
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      heroTitle: page.heroTitle || "",
      heroSubtitle: page.heroSubtitle || "",
      showInFooter: page.showInFooter,
      footerOrder: page.footerOrder,
      footerColumn: page.footerColumn,
    });
    setShowPageDialog(true);
  };

  const handleSubmitPage = () => {
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, data: pageForm });
    } else {
      createPageMutation.mutate(pageForm);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Content Management System</h3>
          <p className="text-sm text-gray-500">Manage website pages, content sections, and form submissions</p>
        </div>
        <div className="flex gap-2">
          {pages.length === 0 && (
            <Button
              onClick={() => seedPagesMutation.mutate()}
              disabled={seedPagesMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              data-testid="button-seed-pages"
            >
              {seedPagesMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Layout className="w-4 h-4 mr-2" />}
              Create Default Pages
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="pages" className="data-[state=active]:bg-white" data-testid="tab-cms-pages">
            <Layout className="w-4 h-4 mr-2" />
            Pages ({pages.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-white" data-testid="tab-cms-submissions">
            <Mail className="w-4 h-4 mr-2" />
            Form Submissions ({submissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">All Pages</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetPageForm();
                      setEditingPage(null);
                      setShowPageDialog(true);
                    }}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    data-testid="button-add-page"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 p-3">
                    {pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => setSelectedPageId(page.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedPageId === page.id
                            ? "bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200"
                            : "hover:bg-gray-50"
                        }`}
                        data-testid={`page-item-${page.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{page.title}</span>
                          <Badge className={statusColors[page.status] || "bg-gray-100"}>
                            {page.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">/{page.slug}</p>
                      </button>
                    ))}
                    {pages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Layout className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No pages yet</p>
                        <p className="text-xs">Create default pages to get started</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {pageWithSections?.page?.title || "Select a Page"}
                    </CardTitle>
                    {pageWithSections?.page && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Globe className="w-3 h-3" />
                        /{pageWithSections.page.slug}
                        <a
                          href={`/${pageWithSections.page.slug}`}
                          target="_blank"
                          className="text-violet-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Preview
                        </a>
                      </CardDescription>
                    )}
                  </div>
                  {pageWithSections?.page && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPage(pageWithSections.page)}
                        data-testid="button-edit-page"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {pageWithSections.page.status === "draft" ? (
                        <Button
                          size="sm"
                          onClick={() => publishPageMutation.mutate(pageWithSections.page.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          data-testid="button-publish-page"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Publish
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unpublishPageMutation.mutate(pageWithSections.page.id)}
                          data-testid="button-unpublish-page"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Unpublish
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this page?")) {
                            deletePageMutation.mutate(pageWithSections.page.id);
                          }
                        }}
                        data-testid="button-delete-page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pageWithSections ? (
                  <CMSPageBuilder
                    pageId={pageWithSections.page.id}
                    sections={pageWithSections.sections}
                    onSectionsChange={() => refetchPageSections()}
                    toast={toast}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a page to view and edit its content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>Contact, partner, and notification form submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{sub.formType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{sub.message || "-"}</TableCell>
                      <TableCell>
                        <Badge className={formStatusColors[sub.status]}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(sub.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sub.status}
                          onValueChange={(value) => updateSubmissionMutation.mutate({ id: sub.id, status: value })}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {submissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No form submissions yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingPage ? "Edit Page" : "Create New Page"}</DialogTitle>
            <DialogDescription>
              {editingPage ? "Update page settings and SEO metadata" : "Add a new CMS page to your website"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Page Title *</Label>
                <Input
                  value={pageForm.title}
                  onChange={(e) => {
                    setPageForm({ 
                      ...pageForm, 
                      title: e.target.value,
                      slug: editingPage ? pageForm.slug : generateSlug(e.target.value)
                    });
                  }}
                  placeholder="About Us"
                  data-testid="input-page-title"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                  placeholder="about-us"
                  data-testid="input-page-slug"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Page Type</Label>
                <Select value={pageForm.pageType} onValueChange={(v) => setPageForm({ ...pageForm, pageType: v })}>
                  <SelectTrigger data-testid="select-page-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Content Page</SelectItem>
                    <SelectItem value="contact">Contact Page</SelectItem>
                    <SelectItem value="faq">FAQ Page</SelectItem>
                    <SelectItem value="policy">Policy Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Footer Column</Label>
                <Select value={pageForm.footerColumn} onValueChange={(v) => setPageForm({ ...pageForm, footerColumn: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="resources">Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hero Title</Label>
                <Input
                  value={pageForm.heroTitle}
                  onChange={(e) => setPageForm({ ...pageForm, heroTitle: e.target.value })}
                  placeholder="Welcome to Our Page"
                />
              </div>
              <div className="space-y-2">
                <Label>Hero Subtitle</Label>
                <Input
                  value={pageForm.heroSubtitle}
                  onChange={(e) => setPageForm({ ...pageForm, heroSubtitle: e.target.value })}
                  placeholder="A brief description"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meta Title (SEO)</Label>
              <Input
                value={pageForm.metaTitle}
                onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })}
                placeholder="Page Title - Samikaran Olympiad"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={pageForm.metaDescription}
                onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                placeholder="A brief description for search engines..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={pageForm.showInFooter}
                  onCheckedChange={(v) => setPageForm({ ...pageForm, showInFooter: v })}
                  id="showInFooter"
                />
                <Label htmlFor="showInFooter">Show in Footer</Label>
              </div>
              {pageForm.showInFooter && (
                <div className="flex items-center gap-2">
                  <Label>Order:</Label>
                  <Input
                    type="number"
                    value={pageForm.footerOrder}
                    onChange={(e) => setPageForm({ ...pageForm, footerOrder: parseInt(e.target.value) || 0 })}
                    className="w-20"
                  />
                </div>
              )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-shrink-0 pt-4">
            <Button variant="outline" onClick={() => setShowPageDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitPage}
              disabled={!pageForm.title || !pageForm.slug || createPageMutation.isPending || updatePageMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              data-testid="button-save-page"
            >
              {(createPageMutation.isPending || updatePageMutation.isPending) && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingPage ? "Update Page" : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
