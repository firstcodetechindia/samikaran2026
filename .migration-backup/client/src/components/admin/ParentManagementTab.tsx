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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Plus, Link2, MessageSquare, RefreshCw, Eye, Phone, Mail,
  GraduationCap, ToggleLeft, Send, Search
} from "lucide-react";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ParentManagementTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showLink, setShowLink] = useState<any>(null);
  const [showMsg, setShowMsg] = useState(false);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [msgText, setMsgText] = useState("");

  const { data: parents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/parents"],
    queryFn: () => fetch("/sysctrl/api/parents").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const linkMut = useMutation({
    mutationFn: ({ parentId, studentId }: any) => apiRequest("POST", `/sysctrl/api/parents/${parentId}/link-student`, { studentId: parseInt(studentId) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/parents"] }); setShowLink(null); toast({ title: "Student linked!" }); },
    onError: () => toast({ title: "Link failed", variant: "destructive" }),
  });

  const togglePortal = useMutation({
    mutationFn: ({ id, enabled }: any) => apiRequest("PUT", `/sysctrl/api/parents/${id}/portal`, { enabled }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/parents"] }); toast({ title: "Portal access updated" }); },
  });

  const bulkMsg = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/sysctrl/api/parents/bulk-message", data),
    onSuccess: () => { setShowMsg(false); setMsgText(""); toast({ title: "Message queued for all parents!" }); },
    onError: () => toast({ title: "Failed to send", variant: "destructive" }),
  });

  const filtered = parents.filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const activeParents = parents.filter((p: any) => p.status === "active").length;
  const portalEnabled = parents.filter((p: any) => p.portalEnabled).length;
  const totalLinked = parents.reduce((sum: number, p: any) => sum + (p.linkedStudents?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-600" /> Parent Portal Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage parent accounts, linked students, and portal access</p>
        </div>
        <Button onClick={() => setShowMsg(true)} className="bg-gradient-to-r from-pink-500 to-rose-600 text-white" data-testid="button-bulk-message-parents">
          <MessageSquare className="w-4 h-4 mr-2" /> Bulk Message
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Parents", value: parents.length, icon: Users, color: "from-pink-500 to-rose-500" },
          { label: "Active", value: activeParents, icon: Eye, color: "from-emerald-500 to-green-500" },
          { label: "Portal Enabled", value: portalEnabled, icon: ToggleLeft, color: "from-blue-500 to-indigo-500" },
          { label: "Linked Students", value: totalLinked, icon: GraduationCap, color: "from-violet-500 to-fuchsia-500" },
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

      <Card className="shadow-sm border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search parents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-parents" />
            </div>
            <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/parents"] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No parents found</p>
              <p className="text-sm">Parent accounts are created automatically when parents register</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Linked Students</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} data-testid={`row-parent-${p.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                          {p.name?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                        <span className="font-medium text-sm">{p.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {p.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3" />{p.email}</div>}
                        {p.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{p.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.linkedStudents?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.linkedStudents.map((s: any) => (
                            <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No students linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(p.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{p.status || "active"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!p.portalEnabled} onCheckedChange={v => togglePortal.mutate({ id: p.id, enabled: v })} data-testid={`switch-portal-${p.id}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setShowLink(p)} className="text-blue-600 hover:text-blue-700" data-testid={`button-link-student-${p.id}`}>
                        <Link2 className="w-3.5 h-3.5 mr-1" /> Link Student
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Link Student Dialog */}
      <Dialog open={!!showLink} onOpenChange={() => setShowLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" /> Link Student to {showLink?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student ID</Label>
              <Input value={linkStudentId} onChange={e => setLinkStudentId(e.target.value)} placeholder="Enter student's ID number" className="mt-1" data-testid="input-link-student-id" />
              <p className="text-xs text-gray-500 mt-1">Enter the student's numeric ID from the Students section</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLink(null)}>Cancel</Button>
            <Button onClick={() => linkMut.mutate({ parentId: showLink.id, studentId: linkStudentId })} disabled={linkMut.isPending || !linkStudentId} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-confirm-link">
              {linkMut.isPending ? "Linking..." : "Link Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Message Dialog */}
      <Dialog open={showMsg} onOpenChange={setShowMsg}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-600" /> Bulk Message to All Parents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-pink-50 rounded-lg p-3 text-sm text-pink-700 border border-pink-100">
              This message will be sent via email to all <strong>{parents.length}</strong> active parents.
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type your message to parents..." rows={5} className="mt-1" data-testid="textarea-bulk-message" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMsg(false)}>Cancel</Button>
            <Button onClick={() => bulkMsg.mutate({ message: msgText })} disabled={bulkMsg.isPending || !msgText} className="bg-gradient-to-r from-pink-500 to-rose-600 text-white" data-testid="button-send-bulk-message">
              {bulkMsg.isPending ? "Sending..." : `Send to ${parents.length} Parents`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
