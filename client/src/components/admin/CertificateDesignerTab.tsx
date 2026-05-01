import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Award, Plus, Save, Download, Users, Eye, Trash2, RefreshCw,
  Type, Image, Palette, AlignLeft, AlignCenter, AlignRight, Wand2,
  FileDown, Share2, Mail, Loader2, CheckCircle
} from "lucide-react";

const PLACEHOLDERS = [
  { label: "Student Name", value: "{{studentName}}" },
  { label: "Olympiad Name", value: "{{olympiadName}}" },
  { label: "Rank", value: "{{rank}}" },
  { label: "Score", value: "{{score}}" },
  { label: "Date", value: "{{date}}" },
  { label: "Class", value: "{{class}}" },
  { label: "School Name", value: "{{schoolName}}" },
  { label: "Student ID", value: "{{studentId}}" },
  { label: "Certificate No", value: "{{certNo}}" },
];

const FONT_OPTIONS = ["serif", "sans-serif", "Georgia", "Playfair Display", "Montserrat", "Dancing Script"];

const BG_PRESETS = [
  { label: "Royal Purple", value: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)" },
  { label: "Golden Academic", value: "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)" },
  { label: "Ocean Blue", value: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)" },
  { label: "Emerald Green", value: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)" },
  { label: "Rose Gold", value: "linear-gradient(135deg, #881337 0%, #be185d 50%, #ec4899 100%)" },
  { label: "Classic White", value: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" },
];

export default function CertificateDesignerTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("designer");
  const [templateName, setTemplateName] = useState("Samikaran Excellence Certificate");
  const [selectedBg, setSelectedBg] = useState(BG_PRESETS[0].value);
  const [primaryColor, setPrimaryColor] = useState("#FFD700");
  const [fontFamily, setFontFamily] = useState("Georgia");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [titleText, setTitleText] = useState("Certificate of Excellence");
  const [bodyText, setBodyText] = useState("This is to certify that\n\n{{studentName}}\n\nhas successfully completed\n\n{{olympiadName}}\n\nand achieved Rank {{rank}} with a score of {{score}}%\n\non {{date}}");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkOlympiad, setBulkOlympiad] = useState("");
  const [bulkFilter, setBulkFilter] = useState("all");
  const [generating, setGenerating] = useState(false);

  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/certificates/templates"],
    queryFn: () => fetch("/sysctrl/api/certificates/templates").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/exams-list"],
    queryFn: () => fetch("/sysctrl/api/exams-list").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const saveMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/sysctrl/api/certificates/design", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/certificates/templates"] }); toast({ title: "Template saved!" }); },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/sysctrl/api/certificates/templates/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/certificates/templates"] }); toast({ title: "Template deleted" }); },
  });

  const handleSave = () => {
    saveMut.mutate({
      name: templateName,
      templateJson: { bg: selectedBg, primaryColor, fontFamily, textAlign, titleText, bodyText },
      primaryColor,
      fontFamily,
    });
  };

  const handleBulkGenerate = async () => {
    if (!bulkOlympiad) { toast({ title: "Select an olympiad", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      await apiRequest("POST", "/sysctrl/api/certificates/bulk-generate", { olympiadId: parseInt(bulkOlympiad), filter: bulkFilter });
      toast({ title: "Bulk generation started!", description: "Certificates will be ready shortly. Check the Certificates section." });
      setShowBulk(false);
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const previewBody = bodyText.replace(/{{studentName}}/g, "Rahul Sharma").replace(/{{olympiadName}}/g, "Science Olympiad 2025").replace(/{{rank}}/g, "5").replace(/{{score}}/g, "92").replace(/{{date}}/g, "April 19, 2025").replace(/{{class}}/g, "10").replace(/{{schoolName}}/g, "Delhi Public School").replace(/{{studentId}}/g, "SOL2025-00123").replace(/{{certNo}}/g, "CERT-2025-00456");

  const isLight = selectedBg.includes("#f8fafc") || selectedBg.includes("#e2e8f0");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" /> Certificate Designer & Bulk Generator
          </h2>
          <p className="text-gray-500 text-sm mt-1">Design certificate templates and generate PDFs in bulk</p>
        </div>
        <Button onClick={() => setShowBulk(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white" data-testid="button-bulk-generate-certs">
          <Users className="w-4 h-4 mr-2" /> Bulk Generate
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="designer">Template Designer</TabsTrigger>
          <TabsTrigger value="saved">Saved Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="designer" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <Card className="shadow-sm border-0 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-violet-600" /> Design Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Template Name</Label>
                  <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="mt-1" data-testid="input-template-name" />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Background Theme</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {BG_PRESETS.map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => setSelectedBg(bg.value)}
                        className={`h-10 rounded-lg border-2 transition-all ${selectedBg === bg.value ? "border-violet-500 scale-105" : "border-transparent"}`}
                        style={{ background: bg.value }}
                        title={bg.label}
                        data-testid={`bg-preset-${bg.label.replace(/\s/g, "-").toLowerCase()}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer border" data-testid="input-accent-color" />
                    <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="mt-1" data-testid="select-font-family"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Text Alignment</Label>
                  <div className="flex gap-1 mt-1">
                    {[["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]].map(([v, Icon]: any) => (
                      <Button key={v} variant={textAlign === v ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setTextAlign(v as any)}>
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Certificate Title</Label>
                  <Input value={titleText} onChange={e => setTitleText(e.target.value)} className="mt-1" data-testid="input-cert-title" />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500">Certificate Body Text</Label>
                  <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={6} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" data-testid="textarea-cert-body" />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 mb-2 block">Insert Placeholder</Label>
                  <div className="flex flex-wrap gap-1">
                    {PLACEHOLDERS.map(p => (
                      <button key={p.value} onClick={() => setBodyText(b => b + " " + p.value)} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5 hover:bg-violet-100 transition-colors" data-testid={`placeholder-${p.value.replace(/[{}]/g, "")}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saveMut.isPending} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-save-template">
                  <Save className="w-4 h-4 mr-2" /> {saveMut.isPending ? "Saving..." : "Save Template"}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4 text-gray-500" /> Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-xl p-8 min-h-96 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl"
                    style={{ background: selectedBg, fontFamily, textAlign }}
                    data-testid="cert-preview-canvas"
                  >
                    {/* Decorative border */}
                    <div className="absolute inset-4 border-2 rounded-lg opacity-30" style={{ borderColor: primaryColor }} />
                    <div className="absolute inset-6 border rounded-lg opacity-15" style={{ borderColor: primaryColor }} />

                    {/* Logo placeholder */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: primaryColor }}>
                      <Award className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold mb-2" style={{ color: primaryColor, fontFamily, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                      {titleText}
                    </h1>

                    {/* Decorative line */}
                    <div className="w-32 h-0.5 mb-4 rounded" style={{ background: primaryColor }} />

                    {/* Body */}
                    <div className={`whitespace-pre-line text-sm leading-relaxed max-w-sm ${isLight ? "text-gray-800" : "text-white/90"}`} style={{ textAlign }}>
                      {previewBody}
                    </div>

                    {/* Signature area */}
                    <div className={`mt-8 flex gap-16 ${isLight ? "text-gray-600" : "text-white/70"}`}>
                      <div className="text-center">
                        <div className="w-24 border-t mb-1" style={{ borderColor: primaryColor }} />
                        <p className="text-xs">Examiner</p>
                      </div>
                      <div className="text-center">
                        <div className="w-24 border-t mb-1" style={{ borderColor: primaryColor }} />
                        <p className="text-xs">Director</p>
                      </div>
                    </div>

                    {/* Watermark */}
                    <div className="absolute bottom-6 right-6 text-[10px] opacity-40" style={{ color: isLight ? "#333" : "#fff" }}>
                      Samikaran Olympiad
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">This is a live preview — actual PDFs will match your design</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No saved templates</p>
              <p className="text-sm">Design and save your first certificate template</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t: any) => (
                <Card key={t.id} className="shadow-sm hover:shadow-md transition-shadow border-0" data-testid={`card-template-${t.id}`}>
                  <div className="h-24 rounded-t-lg" style={{ background: t.templateJson?.bg || BG_PRESETS[0].value }} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: t.fontFamily }}>{t.fontFamily}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ background: t.primaryColor }} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" data-testid={`button-use-template-${t.id}`} onClick={() => {
                        if (t.templateJson) {
                          setSelectedBg(t.templateJson.bg || BG_PRESETS[0].value);
                          setPrimaryColor(t.primaryColor || "#FFD700");
                          setFontFamily(t.fontFamily || "Georgia");
                          setBodyText(t.templateJson.bodyText || bodyText);
                          setTitleText(t.templateJson.titleText || titleText);
                          setTemplateName(t.name);
                          setActiveTab("designer");
                        }
                      }}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 text-xs" onClick={() => deleteMut.mutate(t.id)} data-testid={`button-delete-template-${t.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Generate Dialog */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" /> Bulk Certificate Generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Olympiad</Label>
              <Select value={bulkOlympiad} onValueChange={setBulkOlympiad}>
                <SelectTrigger className="mt-1" data-testid="select-bulk-olympiad"><SelectValue placeholder="Choose an olympiad..." /></SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Generate For</Label>
              <Select value={bulkFilter} onValueChange={setBulkFilter}>
                <SelectTrigger className="mt-1" data-testid="select-bulk-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Participants</SelectItem>
                  <SelectItem value="passed">Passed Students Only</SelectItem>
                  <SelectItem value="toppers">Top 10% (Toppers)</SelectItem>
                  <SelectItem value="top100">Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Certificate Template</Label>
              <Select defaultValue={templates[0]?.id?.toString()}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={templates.length === 0 ? "No templates saved" : "Select template"} /></SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 border border-amber-100">
              <Wand2 className="w-4 h-4 inline mr-1" />
              Certificates will be generated as individual PDFs and packaged into a ZIP file for download.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={handleBulkGenerate} disabled={generating || !bulkOlympiad} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white" data-testid="button-start-bulk-generate">
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><FileDown className="w-4 h-4 mr-2" /> Generate ZIP</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
