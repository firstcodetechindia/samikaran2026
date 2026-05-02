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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tag, Plus, Edit2, Trash2, Pause, Play, Copy, RefreshCw, Wand2,
  TrendingUp, BarChart3, Percent, IndianRupee, Calendar, Users, Hash
} from "lucide-react";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function genCode(prefix = "SAMIK") {
  return prefix.toUpperCase() + Math.floor(1000 + Math.random() * 9000);
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200",
  exhausted: "bg-red-100 text-red-700 border-red-200",
};

export default function CouponManagementTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "", type: "percentage", value: "", minOrder: "", maxUses: "100",
    expiryDate: "", status: "active",
  });

  const [bulkForm, setBulkForm] = useState({ prefix: "SAMIK", count: "10", type: "percentage", value: "", maxUses: "50", expiryDate: "" });

  const { data: coupons = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/coupons"],
    queryFn: () => fetch("/sysctrl/api/coupons").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/sysctrl/api/coupons", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/coupons"] }); setShowCreate(false); toast({ title: "Coupon created!" }); },
    onError: () => toast({ title: "Failed to create coupon", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PUT", `/sysctrl/api/coupons/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/coupons"] }); setEditCoupon(null); toast({ title: "Coupon updated!" }); },
    onError: () => toast({ title: "Failed to update coupon", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/sysctrl/api/coupons/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/coupons"] }); toast({ title: "Coupon deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const bulkMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/sysctrl/api/coupons/bulk", data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/coupons"] });
      setShowBulk(false);
      toast({ title: `Generated ${bulkForm.count} coupons!` });
    },
    onError: () => toast({ title: "Bulk generation failed", variant: "destructive" }),
  });

  const toggleStatus = (coupon: any) => {
    const newStatus = coupon.status === "active" ? "paused" : "active";
    updateMut.mutate({ id: coupon.id, data: { status: newStatus } });
  };

  const filtered = coupons.filter(c =>
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenueSaved = coupons.reduce((s: number, c: any) => s + (c.usedCount || 0) * (c.value || 0), 0);
  const totalRedemptions = coupons.reduce((s: number, c: any) => s + (c.usedCount || 0), 0);
  const activeCoupons = coupons.filter((c: any) => c.status === "active").length;

  const openCreate = () => {
    setForm({ code: genCode(), type: "percentage", value: "", minOrder: "0", maxUses: "100", expiryDate: "", status: "active" });
    setShowCreate(true);
  };

  const openEdit = (c: any) => {
    setForm({ code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder || 0), maxUses: String(c.maxUses), expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : "", status: c.status });
    setEditCoupon(c);
  };

  const handleSubmit = () => {
    const data = { code: form.code, type: form.type, value: parseFloat(form.value), minOrder: parseFloat(form.minOrder || "0"), maxUses: parseInt(form.maxUses), expiryDate: form.expiryDate || null, status: form.status };
    if (editCoupon) updateMut.mutate({ id: editCoupon.id, data });
    else createMut.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-violet-600" /> Coupon & Discount Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">Create, track, and manage discount codes for your olympiads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulk(true)} data-testid="button-bulk-generate">
            <Wand2 className="w-4 h-4 mr-2" /> Bulk Generate
          </Button>
          <Button onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-create-coupon">
            <Plus className="w-4 h-4 mr-2" /> Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Coupons", value: coupons.length, icon: Tag, color: "from-violet-500 to-fuchsia-500" },
          { label: "Active", value: activeCoupons, icon: Play, color: "from-emerald-500 to-green-500" },
          { label: "Total Redemptions", value: totalRedemptions, icon: Users, color: "from-blue-500 to-indigo-500" },
          { label: "Revenue Impact", value: `₹${totalRevenueSaved.toLocaleString("en-IN")}`, icon: IndianRupee, color: "from-orange-500 to-amber-500" },
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

      {/* Table */}
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input placeholder="Search coupon codes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-4" data-testid="input-search-coupons" />
            </div>
            <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/coupons"] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading coupons...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No coupons found</p>
              <p className="text-sm">Create your first coupon to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Code</TableHead>
                  <TableHead>Type & Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => {
                  const usePct = c.maxUses > 0 ? Math.round((c.usedCount / c.maxUses) * 100) : 0;
                  return (
                    <TableRow key={c.id} data-testid={`row-coupon-${c.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">{c.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(c.code); toast({ title: "Copied!" }); }}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {c.type === "percentage" ? <Percent className="w-3 h-3 text-violet-500" /> : <IndianRupee className="w-3 h-3 text-emerald-500" />}
                          <span className="font-semibold">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</span>
                          <span className="text-xs text-gray-400 ml-1">{c.type === "percentage" ? "off" : "flat"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{c.usedCount}/{c.maxUses}</span>
                            <span className="text-gray-400">{usePct}%</span>
                          </div>
                          <Progress value={usePct} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.minOrder > 0 ? `₹${c.minOrder}` : "None"}</TableCell>
                      <TableCell className="text-sm">{fmtDate(c.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs border ${statusColors[c.status] || statusColors.active}`}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(c)} data-testid={`button-toggle-coupon-${c.id}`}>
                            {c.status === "active" ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)} data-testid={`button-edit-coupon-${c.id}`}>
                            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(c.id)} data-testid={`button-delete-coupon-${c.id}`}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate || !!editCoupon} onOpenChange={open => { if (!open) { setShowCreate(false); setEditCoupon(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-violet-600" />
              {editCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAMIK50" data-testid="input-coupon-code" />
                <Button variant="outline" onClick={() => setForm(f => ({ ...f, code: genCode() }))} className="shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-coupon-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value {form.type === "percentage" ? "(%)" : "(₹)"}</Label>
                <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 50"} className="mt-1" data-testid="input-coupon-value" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order (₹)</Label>
                <Input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="0" className="mt-1" data-testid="input-coupon-min-order" />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="100" className="mt-1" data-testid="input-coupon-max-uses" />
              </div>
            </div>
            <div>
              <Label>Expiry Date (optional)</Label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="mt-1" data-testid="input-coupon-expiry" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditCoupon(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-submit-coupon">
              {(createMut.isPending || updateMut.isPending) ? "Saving..." : editCoupon ? "Update Coupon" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-600" /> Bulk Generate Coupons
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prefix</Label>
                <Input value={bulkForm.prefix} onChange={e => setBulkForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} placeholder="SAMIK" className="mt-1" data-testid="input-bulk-prefix" />
              </div>
              <div>
                <Label>Count</Label>
                <Input type="number" value={bulkForm.count} onChange={e => setBulkForm(f => ({ ...f, count: e.target.value }))} placeholder="10" className="mt-1" data-testid="input-bulk-count" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={bulkForm.type} onValueChange={v => setBulkForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input type="number" value={bulkForm.value} onChange={e => setBulkForm(f => ({ ...f, value: e.target.value }))} placeholder="10" className="mt-1" data-testid="input-bulk-value" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Uses Each</Label>
                <Input type="number" value={bulkForm.maxUses} onChange={e => setBulkForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="50" className="mt-1" />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={bulkForm.expiryDate} onChange={e => setBulkForm(f => ({ ...f, expiryDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="bg-violet-50 rounded-lg p-3 text-sm text-violet-700">
              Will generate codes like <strong>{bulkForm.prefix}1001</strong>, <strong>{bulkForm.prefix}1002</strong>, ...
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={() => bulkMut.mutate({ prefix: bulkForm.prefix, count: parseInt(bulkForm.count), type: bulkForm.type, value: parseFloat(bulkForm.value), maxUses: parseInt(bulkForm.maxUses), expiryDate: bulkForm.expiryDate || null })} disabled={bulkMut.isPending} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-submit-bulk">
              {bulkMut.isPending ? "Generating..." : `Generate ${bulkForm.count} Coupons`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
