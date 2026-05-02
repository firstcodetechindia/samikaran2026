import { useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Send, Plus, RefreshCw, CheckCheck, AlertCircle,
  Users, Clock, BarChart3, Settings, FileText, PhoneOff, Eye, Play
} from "lucide-react";

const TEMPLATES = [
  { id: "registration_confirmed", name: "Registration Confirmed", desc: "Sent after student registers for olympiad", body: "Dear {{studentName}}, your registration for *{{olympiadName}}* is confirmed! 🎉\n\nExam Date: {{examDate}}\nStudent ID: {{studentId}}\n\nBest of luck! 🌟\n- Samikaran Olympiad Team" },
  { id: "exam_reminder", name: "Exam Reminder (1 Day Before)", desc: "Reminder sent 1 day before exam", body: "⏰ *Exam Reminder!*\n\nHi {{studentName}}, your *{{olympiadName}}* exam is TOMORROW!\n\nDate: {{examDate}}\nTime: {{examTime}}\n\nEnsure good internet & quiet environment. 📚\n- Samikaran Team" },
  { id: "result_ready", name: "Result Ready", desc: "Sent when results are published", body: "🏆 *Your Result is Ready!*\n\nHi {{studentName}}, your *{{olympiadName}}* result is now available.\n\nScore: {{score}}/{{totalMarks}}\nRank: {{rank}}\n\nView full results: {{resultLink}}\n- Samikaran Team" },
  { id: "certificate_available", name: "Certificate Available", desc: "Sent when certificate is generated", body: "🎓 *Certificate Ready!*\n\nCongratulations {{studentName}}! Your certificate for *{{olympiadName}}* is ready.\n\nDownload: {{certificateLink}}\n\nShare your achievement! 🌟" },
  { id: "payment_successful", name: "Payment Successful", desc: "Payment confirmation message", body: "✅ *Payment Confirmed!*\n\nHi {{studentName}},\nPayment of ₹{{amount}} for {{olympiadName}} received.\n\nTransaction ID: {{txnId}}\nDate: {{paymentDate}}\n\nThank you! 🙏" },
];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function WhatsAppTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", templateId: "", segment: "all", scheduledAt: "" });

  const { data: campaigns = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/whatsapp/campaigns"],
    queryFn: () => fetch("/sysctrl/api/whatsapp/campaigns").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: optOuts = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/whatsapp/opt-outs"],
    queryFn: () => fetch("/sysctrl/api/whatsapp/opt-outs").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/sysctrl/api/whatsapp/campaigns", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/whatsapp/campaigns"] }); setShowCreate(false); toast({ title: "Campaign created!" }); },
    onError: () => toast({ title: "Failed to create campaign", variant: "destructive" }),
  });

  const totalSent = campaigns.reduce((s: number, c: any) => s + (c.sentCount || 0), 0);
  const totalDelivered = campaigns.reduce((s: number, c: any) => s + (c.deliveredCount || 0), 0);
  const totalRead = campaigns.reduce((s: number, c: any) => s + (c.readCount || 0), 0);
  const avgDeliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-100 text-blue-700",
    sending: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" /> WhatsApp Notification Module
          </h2>
          <p className="text-gray-500 text-sm mt-1">Send bulk WhatsApp messages to students, parents, and schools</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white" data-testid="button-create-campaign">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send, color: "from-emerald-500 to-green-500" },
          { label: "Delivered", value: totalDelivered.toLocaleString(), icon: CheckCheck, color: "from-blue-500 to-indigo-500" },
          { label: "Read", value: totalRead.toLocaleString(), icon: Eye, color: "from-violet-500 to-fuchsia-500" },
          { label: "Delivery Rate", value: `${avgDeliveryRate}%`, icon: BarChart3, color: "from-orange-500 to-amber-500" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="bg-white border">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="optouts">Opt-Outs ({optOuts.length})</TabsTrigger>
          <TabsTrigger value="settings">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No campaigns yet</p>
                  <p className="text-sm">Create your first WhatsApp campaign</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c: any) => (
                      <TableRow key={c.id} data-testid={`row-campaign-${c.id}`}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{c.templateId}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{c.segment}</Badge></TableCell>
                        <TableCell>{c.sentCount || 0}</TableCell>
                        <TableCell className="text-emerald-600">{c.deliveredCount || 0}</TableCell>
                        <TableCell className="text-blue-600">{c.readCount || 0}</TableCell>
                        <TableCell><Badge className={`text-xs ${statusColor[c.status] || statusColor.draft}`}>{c.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map(t => (
              <Card key={t.id} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPreviewTemplate(t)} data-testid={`card-template-${t.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <CardDescription className="text-xs">{t.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-emerald-50 rounded-lg p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap line-clamp-4 border border-emerald-100">
                    {t.body.slice(0, 120)}...
                  </div>
                  <Button size="sm" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, templateId: t.id, name: t.name + " Campaign" })); setShowCreate(true); }}>
                    <Play className="w-3 h-3 mr-1" /> Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optouts" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><PhoneOff className="w-4 h-4 text-red-500" /> Opt-Out List</CardTitle>
              <CardDescription>Users who have opted out of WhatsApp notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {optOuts.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No opt-outs recorded</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Phone</TableHead><TableHead>Opted Out</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {optOuts.map((o: any) => (
                      <TableRow key={o.id}><TableCell className="font-mono">{o.phone}</TableCell><TableCell>{fmtDate(o.optedOutAt)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4 text-gray-500" /> WhatsApp Integration</CardTitle>
              <CardDescription>Configure Twilio or WATI for WhatsApp message delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                <strong>Integration Placeholder:</strong> Configure your WhatsApp Business API provider below. Supports Twilio and WATI.
              </div>
              <div className="grid gap-4">
                <div>
                  <Label>Provider</Label>
                  <Select defaultValue="twilio">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio WhatsApp</SelectItem>
                      <SelectItem value="wati">WATI</SelectItem>
                      <SelectItem value="interakt">Interakt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Key / Account SID</Label>
                  <Input type="password" placeholder="••••••••••••••••" className="mt-1" data-testid="input-wa-api-key" />
                </div>
                <div>
                  <Label>Auth Token / API Secret</Label>
                  <Input type="password" placeholder="••••••••••••••••" className="mt-1" data-testid="input-wa-auth-token" />
                </div>
                <div>
                  <Label>WhatsApp Business Number</Label>
                  <Input placeholder="+91XXXXXXXXXX" className="mt-1" data-testid="input-wa-number" />
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-fit" data-testid="button-save-wa-config">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> Create WhatsApp Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Exam Reminder — July 2025" className="mt-1" data-testid="input-campaign-name" />
            </div>
            <div>
              <Label>Message Template</Label>
              <Select value={form.templateId} onValueChange={v => setForm(f => ({ ...f, templateId: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-campaign-template"><SelectValue placeholder="Select a template" /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Segment</Label>
              <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-campaign-segment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="class_6_8">Class 6–8</SelectItem>
                  <SelectItem value="class_9_10">Class 9–10</SelectItem>
                  <SelectItem value="class_11_12">Class 11–12</SelectItem>
                  <SelectItem value="school_registered">School-Registered Only</SelectItem>
                  <SelectItem value="individual_registered">Individual Registrations</SelectItem>
                  <SelectItem value="paid">Paid Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schedule (leave empty to send now)</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="mt-1" data-testid="input-campaign-schedule" />
            </div>
            {form.templateId && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-xs font-medium text-emerald-700 mb-1">Preview:</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {TEMPLATES.find(t => t.id === form.templateId)?.body.slice(0, 200)}...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.name || !form.templateId} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-submit-campaign">
              {createMut.isPending ? "Creating..." : form.scheduledAt ? "Schedule Campaign" : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{previewTemplate?.name}</DialogTitle></DialogHeader>
          <div className="bg-[#dcf8c6] rounded-lg p-4 text-sm whitespace-pre-wrap font-mono border border-green-200 shadow-inner">
            {previewTemplate?.body}
          </div>
          <p className="text-xs text-gray-400 text-center">Variables like {"{{"} studentName {"}}"}  will be auto-filled from your database</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
