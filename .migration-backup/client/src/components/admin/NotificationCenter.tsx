import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bell, CheckCheck, Trash2, X, RefreshCw,
  UserPlus, CreditCard, Shield, LifeBuoy, Award, AlertTriangle,
  CircleOff, CheckCircle
} from "lucide-react";

export type NotificationCategory = "registration" | "payment" | "proctoring" | "support" | "certificate" | "system";

const CATEGORY_CONFIG: Record<NotificationCategory, { icon: any; color: string; bg: string; label: string }> = {
  registration: { icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50", label: "New Registration" },
  payment: { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", label: "Payment" },
  proctoring: { icon: Shield, color: "text-amber-600", bg: "bg-amber-50", label: "Proctoring Alert" },
  support: { icon: LifeBuoy, color: "text-orange-600", bg: "bg-orange-50", label: "Support Ticket" },
  certificate: { icon: Award, color: "text-violet-600", bg: "bg-violet-50", label: "Certificate" },
  system: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "System Alert" },
};

function timeSince(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Bell Icon Component (used in header)
export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/notifications"],
    queryFn: () => fetch("/sysctrl/api/notifications?limit=20").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMut = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/sysctrl/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => apiRequest("PUT", "/sysctrl/api/notifications/mark-all-read"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications"] }),
  });

  const clearMut = useMutation({
    mutationFn: () => apiRequest("DELETE", "/sysctrl/api/notifications/clear"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications"] }),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" data-testid="button-notifications-bell">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-xl border-0 rounded-xl" align="end" data-testid="notification-popover">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-white" />
            <span className="font-semibold text-white text-sm">Notifications</span>
            {unreadCount > 0 && <Badge className="bg-white/20 text-white text-xs border-0">{unreadCount} new</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => markAllMut.mutate()} title="Mark all read" data-testid="button-mark-all-read">
              <CheckCheck className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => clearMut.mutate()} title="Clear all" data-testid="button-clear-notifications">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => {
                const cat = CATEGORY_CONFIG[n.category as NotificationCategory] || CATEGORY_CONFIG.system;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? "bg-violet-50/30" : ""}`}
                    onClick={() => !n.isRead && markReadMut.mutate(n.id)}
                    data-testid={`notification-item-${n.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full ${cat.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <cat.icon className={`w-4 h-4 ${cat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-tight ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{n.createdAt ? timeSince(n.createdAt) : "—"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-violet-600 hover:text-violet-700 w-full" onClick={() => { setOpen(false); window.location.hash = "notifications"; }}>
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Full Notification History Page Tab
export function NotificationHistoryTab() {
  const { toast } = useToast();
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRead, setFilterRead] = useState("all");

  const { data: allNotifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/notifications/all"],
    queryFn: () => fetch("/sysctrl/api/notifications?limit=200").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/sysctrl/api/notifications/${id}/read`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications/all"] }); queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications"] }); },
  });

  const clearMut = useMutation({
    mutationFn: () => apiRequest("DELETE", "/sysctrl/api/notifications/clear"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications/all"] }); queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications"] }); toast({ title: "All notifications cleared" }); },
  });

  const markAllMut = useMutation({
    mutationFn: () => apiRequest("PUT", "/sysctrl/api/notifications/mark-all-read"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications/all"] }); queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/notifications"] }); toast({ title: "All marked as read" }); },
  });

  const filtered = allNotifications.filter((n: any) => {
    const matchCat = filterCategory === "all" || n.category === filterCategory;
    const matchRead = filterRead === "all" || (filterRead === "unread" ? !n.isRead : n.isRead);
    return matchCat && matchRead;
  });

  const unreadCount = allNotifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-violet-600" /> Notification Center
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? <span className="text-violet-600 font-medium">{unreadCount} unread</span> : "All caught up!"} · {allNotifications.length} total notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markAllMut.mutate()} disabled={unreadCount === 0} data-testid="button-mark-all-read-page">
            <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
          <Button variant="outline" onClick={() => clearMut.mutate()} className="text-red-500 hover:text-red-600" data-testid="button-clear-all">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        </div>
      </div>

      {/* Category Quick Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = allNotifications.filter((n: any) => n.category === key).length;
          return (
            <Card key={key} className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${filterCategory === key ? "ring-2 ring-violet-500" : ""}`} onClick={() => setFilterCategory(filterCategory === key ? "all" : key)}>
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center mx-auto mb-1`}>
                  <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48" data-testid="select-filter-category"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-36" data-testid="select-filter-read"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="read">Read Only</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="flex items-center">{filtered.length} notifications</Badge>
      </div>

      {/* Notification List */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No notifications</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n: any) => {
                  const cat = CATEGORY_CONFIG[n.category as NotificationCategory] || CATEGORY_CONFIG.system;
                  return (
                    <TableRow key={n.id} className={!n.isRead ? "bg-violet-50/20" : ""} data-testid={`notification-row-${n.id}`}>
                      <TableCell>
                        <div className={`w-8 h-8 rounded-full ${cat.bg} flex items-center justify-center`}>
                          <cat.icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{n.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className={`text-sm font-medium ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">{fmtDate(n.createdAt)}</TableCell>
                      <TableCell>
                        {n.isRead ? (
                          <Badge className="text-xs bg-gray-100 text-gray-500"><CheckCircle className="w-3 h-3 mr-1" />Read</Badge>
                        ) : (
                          <Badge className="text-xs bg-violet-100 text-violet-700"><CircleOff className="w-3 h-3 mr-1" />Unread</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!n.isRead && (
                          <Button variant="ghost" size="sm" onClick={() => markReadMut.mutate(n.id)} className="text-xs h-7" data-testid={`button-mark-read-${n.id}`}>
                            Mark Read
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
