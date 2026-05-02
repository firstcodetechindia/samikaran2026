import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mail, Send, FileText, Eye, Edit, Trash2, Save,
  CheckCircle, AlertCircle, BarChart3, Link2, Search,
  Loader2, Code, Sparkles, ArrowRight
} from "lucide-react";
import type { EmailTemplate, EmailTemplateAssignment } from "@shared/schema";

interface EmailSendStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

const categoryColors: Record<string, string> = {
  system: "bg-blue-100 text-blue-700",
  partner: "bg-emerald-100 text-emerald-700",
  marketing: "bg-purple-100 text-purple-700",
  events: "bg-orange-100 text-orange-700",
};

const categoryLabels: Record<string, string> = {
  system: "System",
  partner: "Partner/School",
  marketing: "Marketing",
  events: "Events",
};

const typeColors: Record<string, string> = {
  transactional: "bg-sky-100 text-sky-700",
  marketing: "bg-pink-100 text-pink-700",
};

export default function EmailTemplateManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [searchTerm, setSearchTerm] = useState("");
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    subject: "",
    category: "system",
    type: "transactional",
    htmlContent: "",
    previewText: "",
    isActive: true,
  });
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, number | null>>({});
  const [sendTestTemplate, setSendTestTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailTo, setTestEmailTo] = useState("");

  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/sysctrl/email-templates"],
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<EmailTemplateAssignment[]>({
    queryKey: ["/api/sysctrl/email-template-assignments"],
  });

  const { data: stats } = useQuery<EmailSendStats>({
    queryKey: ["/api/sysctrl/email-send-stats"],
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/sysctrl/email-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/email-templates"] });
      setEditTemplate(null);
      toast({ title: "Template updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/sysctrl/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/email-templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const saveAssignmentsMutation = useMutation({
    mutationFn: async (data: { eventType: string; templateId: number | null; isActive?: boolean }[]) => {
      return apiRequest("PUT", "/api/sysctrl/email-template-assignments", { assignments: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/email-template-assignments"] });
      setPendingAssignments({});
      toast({ title: "Assignments saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save assignments", variant: "destructive" });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (id: number) => {
      const resp = await apiRequest("POST", `/api/sysctrl/email-templates/${id}/preview`, { variables: {} });
      return resp.json();
    },
    onSuccess: (data: any) => {
      setPreviewHtml(data.html);
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: async ({ to, templateId }: { to: string; templateId: number }) => {
      const resp = await apiRequest("POST", "/api/sysctrl/email-test", { to, templateId });
      return resp.json();
    },
    onSuccess: (data: any) => {
      setSendTestTemplate(null);
      setTestEmailTo("");
      toast({ title: data.message || "Test email sent!" });
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/email-send-stats"] });
    },
    onError: (err: any) => {
      toast({ title: err?.message || "Failed to send test email", variant: "destructive" });
    },
  });

  const openEditDialog = (template: EmailTemplate) => {
    setEditTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      category: template.category,
      type: template.type,
      htmlContent: template.htmlContent,
      previewText: template.previewText || "",
      isActive: template.isActive ?? true,
    });
  };

  const openPreviewDialog = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    previewMutation.mutate(template.id);
  };

  const openSendTestDialog = (template: EmailTemplate) => {
    setSendTestTemplate(template);
    setTestEmailTo("");
  };

  const handleSendTest = () => {
    if (!sendTestTemplate || !testEmailTo) return;
    sendTestMutation.mutate({ to: testEmailTo, templateId: sendTestTemplate.id });
  };

  const handleSaveTemplate = () => {
    if (!editTemplate) return;
    updateTemplateMutation.mutate({ id: editTemplate.id, data: editForm });
  };

  const handleSaveAssignments = () => {
    const data = Object.entries(pendingAssignments).map(([eventType, templateId]) => ({
      eventType,
      templateId,
    }));
    if (data.length === 0) {
      toast({ title: "No changes to save" });
      return;
    }
    saveAssignmentsMutation.mutate(data);
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasPendingChanges = Object.keys(pendingAssignments).length > 0;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-email-templates">
            <FileText className="w-4 h-4" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2" data-testid="tab-email-assignments">
            <Link2 className="w-4 h-4" />
            Event Assignments
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2" data-testid="tab-email-tracking">
            <BarChart3 className="w-4 h-4" />
            Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-templates"
              />
            </div>
          </div>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                  data-testid={`card-template-${template.id}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{template.name}</p>
                      <p className="text-sm text-gray-500 truncate">Subject: {template.subject}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-[10px] ${categoryColors[template.category] || "bg-gray-100 text-gray-600"}`}>
                          {categoryLabels[template.category] || template.category}
                        </Badge>
                        <Badge className={`text-[10px] ${typeColors[template.type] || "bg-gray-100 text-gray-600"}`}>
                          {template.type}
                        </Badge>
                        {template.variables && (template.variables as string[]).length > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {(template.variables as string[]).length} variables
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Badge className={template.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openSendTestDialog(template)}
                      title="Send Test Email"
                      data-testid={`button-send-test-${template.id}`}
                    >
                      <Send className="w-4 h-4 text-emerald-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openPreviewDialog(template)}
                      title="Preview"
                      data-testid={`button-preview-template-${template.id}`}
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(template)}
                      title="Edit"
                      data-testid={`button-edit-template-${template.id}`}
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                      title="Delete"
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card className="border-violet-200 bg-violet-50/50">
            <CardContent className="pt-4">
              <p className="text-sm text-violet-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Map each system event to an email template. When the event occurs, the assigned template will be used to send the email.
              </p>
            </CardContent>
          </Card>

          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => {
                const currentTemplateId = pendingAssignments[assignment.eventType] !== undefined
                  ? pendingAssignments[assignment.eventType]
                  : assignment.templateId;
                const hasChanged = pendingAssignments[assignment.eventType] !== undefined;

                return (
                  <div
                    key={assignment.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      hasChanged ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"
                    }`}
                    data-testid={`assignment-${assignment.eventType}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{assignment.label}</p>
                      <p className="text-xs text-gray-400 font-mono">{assignment.eventType}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div className="w-64 flex-shrink-0">
                      <Select
                        value={currentTemplateId?.toString() || "none"}
                        onValueChange={(v) => {
                          setPendingAssignments(prev => ({
                            ...prev,
                            [assignment.eventType]: v === "none" ? null : parseInt(v),
                          }));
                        }}
                      >
                        <SelectTrigger className="text-sm" data-testid={`select-assignment-${assignment.eventType}`}>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No template</SelectItem>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {hasChanged && (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">Changed</Badge>
                    )}
                  </div>
                );
              })}

              {assignments.length > 0 && (
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveAssignments}
                    disabled={!hasPendingChanges || saveAssignmentsMutation.isPending}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    data-testid="button-save-assignments"
                  >
                    {saveAssignmentsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Assignments
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatBox label="Total Sent" value={stats?.total || 0} color="violet" />
            <StatBox label="Sent" value={stats?.sent || 0} color="blue" />
            <StatBox label="Delivered" value={stats?.delivered || 0} color="emerald" />
            <StatBox label="Opened" value={stats?.opened || 0} color="amber" />
            <StatBox label="Bounced" value={stats?.bounced || 0} color="red" />
            <StatBox label="Failed" value={stats?.failed || 0} color="gray" />
          </div>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Detailed email analytics will appear here once emails start being sent via a configured provider.</p>
                <p className="text-gray-400 text-xs mt-2">Configure your email provider (Brevo, SendGrid, etc.) in the Email Configuration section above to start sending real emails.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!sendTestTemplate} onOpenChange={(open) => { if (!open) { setSendTestTemplate(null); setTestEmailTo(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              Send Test Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
              <p className="text-sm font-medium text-violet-800">Template: {sendTestTemplate?.name}</p>
              <p className="text-xs text-violet-600 mt-1">Subject: {sendTestTemplate?.subject}</p>
            </div>
            {sendTestTemplate?.variables && (sendTestTemplate.variables as string[]).length > 0 && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-xs text-gray-500 mb-1">Variables will be replaced with sample data:</p>
                <div className="flex flex-wrap gap-1">
                  {(sendTestTemplate.variables as string[]).map(v => (
                    <Badge key={v} className="bg-gray-200 text-gray-600 text-[10px] font-mono">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                data-testid="input-test-email-to"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSendTestTemplate(null); setTestEmailTo(""); }} data-testid="button-cancel-test-email">
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmailTo || sendTestMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
              data-testid="button-confirm-send-test"
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTemplate} onOpenChange={(open) => !open && setEditTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-violet-500" />
              Edit Template: {editTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  data-testid="input-edit-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={editForm.subject}
                  onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))}
                  data-testid="input-edit-template-subject"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-edit-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="partner">Partner/School</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger data-testid="select-edit-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preview Text</Label>
              <Input
                value={editForm.previewText}
                onChange={(e) => setEditForm(f => ({ ...f, previewText: e.target.value }))}
                placeholder="Short text shown in email client preview"
                data-testid="input-edit-template-preview-text"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(v) => setEditForm(f => ({ ...f, isActive: v }))}
                data-testid="switch-edit-template-active"
              />
              <Label>Active</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>HTML Content</Label>
                {editTemplate?.variables && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-gray-400">Variables:</span>
                    {(editTemplate.variables as string[]).map(v => (
                      <Badge key={v} className="bg-violet-100 text-violet-700 text-[10px] font-mono cursor-pointer" onClick={() => {
                        setEditForm(f => ({ ...f, htmlContent: f.htmlContent + `{{${v}}}` }));
                      }}>
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Textarea
                value={editForm.htmlContent}
                onChange={(e) => setEditForm(f => ({ ...f, htmlContent: e.target.value }))}
                className="font-mono text-xs min-h-[300px]"
                data-testid="textarea-edit-template-html"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setEditTemplate(null)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={updateTemplateMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              data-testid="button-save-template"
            >
              {updateTemplateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) { setPreviewTemplate(null); setPreviewHtml(""); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Preview: {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {previewMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : previewHtml ? (
              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full border-0"
                  style={{ minHeight: "500px" }}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                  data-testid="iframe-email-preview"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Loading preview...</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => { setPreviewTemplate(null); setPreviewHtml(""); }} data-testid="button-close-preview">
              Close
            </Button>
            {previewTemplate && (
              <>
                <Button
                  onClick={() => {
                    openSendTestDialog(previewTemplate);
                    setPreviewTemplate(null);
                    setPreviewHtml("");
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                  data-testid="button-preview-send-test"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </Button>
                <Button
                  onClick={() => {
                    setPreviewTemplate(null);
                    setPreviewHtml("");
                    openEditDialog(previewTemplate);
                  }}
                  variant="outline"
                  data-testid="button-preview-to-edit"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Template
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${colorMap[color] || colorMap.gray}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}