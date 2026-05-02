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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  LifeBuoy, MessageSquare, Send, Clock, CheckCircle, AlertCircle,
  RefreshCw, Search, User, Tag, Hash, ChevronRight, BookOpen, Filter
} from "lucide-react";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeSince(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-gray-100 text-gray-500",
  closed: "bg-gray-200 text-gray-400",
};

const CANNED_RESPONSES = [
  { id: 1, title: "Payment Processing", category: "Payment", message: "Thank you for reaching out! Your payment is being processed and you should receive confirmation within 2-4 business hours. Please share your transaction ID for faster resolution." },
  { id: 2, title: "Exam Access Issue", category: "Exam", message: "We apologize for the inconvenience! Please try clearing your browser cache and refreshing the page. Ensure you're using Chrome/Firefox. If the issue persists, please share a screenshot." },
  { id: 3, title: "Certificate Request", category: "Certificate", message: "Your certificate is being processed. It will be available for download within 3-5 business days after results are declared. You'll receive a notification on your registered email." },
  { id: 4, title: "Refund Request", category: "Payment", message: "We've received your refund request. Our team will review it within 48 hours. Refunds are typically processed within 5-7 working days to your original payment method." },
  { id: 5, title: "Technical Support", category: "Tech", message: "Thank you for reporting this technical issue. Our engineering team has been notified. Expected resolution time: 24-48 hours. We'll update you via email once resolved." },
];

export default function SupportTicketTab() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showCanned, setShowCanned] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/tickets"],
    queryFn: () => fetch("/sysctrl/api/tickets").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/sysctrl/api/tickets/stats"],
    queryFn: () => fetch("/sysctrl/api/tickets/stats").then(r => r.json()),
  });

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/tickets", selectedTicket?.id, "messages"],
    queryFn: () => fetch(`/sysctrl/api/tickets/${selectedTicket.id}/messages`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    enabled: !!selectedTicket,
    refetchInterval: 10000,
  });

  const replyMut = useMutation({
    mutationFn: ({ id, message }: any) => apiRequest("POST", `/sysctrl/api/tickets/${id}/reply`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/tickets", selectedTicket?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/tickets"] });
      setReplyText("");
      toast({ title: "Reply sent!" });
    },
    onError: () => toast({ title: "Failed to send reply", variant: "destructive" }),
  });

  const assignMut = useMutation({
    mutationFn: ({ id, status }: any) => apiRequest("PUT", `/sysctrl/api/tickets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/tickets"] });
      if (selectedTicket) setSelectedTicket((t: any) => ({ ...t, status: "in_progress" }));
      toast({ title: "Ticket updated" });
    },
  });

  const filtered = tickets.filter((t: any) => {
    const matchSearch = !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || t.studentName?.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber?.includes(search);
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const openTickets = tickets.filter((t: any) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedToday = tickets.filter((t: any) => t.status === "resolved" && t.resolvedAt && new Date(t.resolvedAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-orange-500" /> Support Ticket System
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage student and parent support requests</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/tickets"] })}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: openTickets, icon: AlertCircle, color: "from-emerald-500 to-green-500" },
          { label: "In Progress", value: inProgressTickets, icon: Clock, color: "from-blue-500 to-indigo-500" },
          { label: "Resolved Today", value: resolvedToday, icon: CheckCircle, color: "from-violet-500 to-fuchsia-500" },
          { label: "Avg Response", value: stats?.avgResponseTime || "—", icon: Clock, color: "from-orange-500 to-amber-500" },
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-tickets" />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tickets found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  {filtered.map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === t.id ? "bg-violet-50 border-l-2 border-l-violet-500" : ""}`}
                      data-testid={`ticket-item-${t.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{t.ticketNumber}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium}`}>{t.priority}</Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{t.subject}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{t.studentName || "Unknown"}</span>
                        <span className="text-xs text-gray-400">{t.createdAt ? timeSince(t.createdAt) : "—"}</span>
                      </div>
                      <Badge className={`text-[10px] mt-1 ${STATUS_COLORS[t.status] || STATUS_COLORS.open}`}>{t.status?.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-3">
          {!selectedTicket ? (
            <Card className="shadow-sm border-0 h-full flex items-center justify-center">
              <CardContent className="text-center text-gray-400 py-16">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Select a ticket</p>
                <p className="text-sm">Click a ticket from the list to view the conversation</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{selectedTicket.ticketNumber}</span>
                      <Badge className={`text-xs border ${PRIORITY_COLORS[selectedTicket.priority] || PRIORITY_COLORS.medium}`}>{selectedTicket.priority}</Badge>
                      <Badge className={`text-xs ${STATUS_COLORS[selectedTicket.status] || STATUS_COLORS.open}`}>{selectedTicket.status?.replace("_", " ")}</Badge>
                    </div>
                    <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{selectedTicket.studentName}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{selectedTicket.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(selectedTicket.createdAt)}</span>
                    </div>
                  </div>
                  <Select value={selectedTicket.status} onValueChange={v => assignMut.mutate({ id: selectedTicket.id, status: v })}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-72 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m: any) => (
                        <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.senderType === "admin" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                            <p className="font-medium text-xs mb-0.5 opacity-70">{m.senderName || (m.senderType === "admin" ? "Admin" : "Student")}</p>
                            <p>{m.message}</p>
                            <p className={`text-[10px] mt-1 ${m.senderType === "admin" ? "opacity-60" : "text-gray-400"}`}>{fmtDate(m.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Reply Box */}
                <div className="border-t p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Reply</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowCanned(true)} className="text-xs h-7" data-testid="button-canned-responses">
                      <BookOpen className="w-3 h-3 mr-1" /> Canned Responses
                    </Button>
                  </div>
                  <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." rows={3} data-testid="textarea-ticket-reply" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => replyMut.mutate({ id: selectedTicket.id, message: replyText })} disabled={replyMut.isPending || !replyText.trim()} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-send-reply">
                      <Send className="w-4 h-4 mr-2" /> {replyMut.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Canned Responses Dialog */}
      <Dialog open={showCanned} onOpenChange={setShowCanned}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-violet-600" /> Canned Responses</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80">
            <div className="space-y-2 pr-4">
              {CANNED_RESPONSES.map(cr => (
                <Card key={cr.id} className="cursor-pointer hover:border-violet-300 transition-colors" onClick={() => { setReplyText(cr.message); setShowCanned(false); }} data-testid={`canned-response-${cr.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{cr.title}</p>
                      <Badge variant="outline" className="text-xs">{cr.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{cr.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
