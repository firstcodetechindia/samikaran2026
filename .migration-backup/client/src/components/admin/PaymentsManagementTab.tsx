import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CreditCard, IndianRupee, DollarSign, Download, Search, Filter, RefreshCw,
  Eye, FileText, AlertCircle, CheckCircle, Clock, XCircle, RotateCcw,
  ChevronLeft, ChevronRight, MoreHorizontal, Building2, Receipt, Target, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Payment {
  id: number;
  userId: string;
  examId: number;
  amount: number;
  baseAmount: number;
  taxAmount: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  currency: string;
  status: string;
  gateway: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  invoiceNumber: string;
  studentCountry: string;
  studentState: string;
  isExportService: boolean;
  createdAt: string;
  paidAt: string;
  refundedAt: string;
  refundReason: string;
}

interface PaymentsManagementTabProps {
  toast: (options: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function PaymentsManagementTab({ toast }: PaymentsManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const itemsPerPage = 15;

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const { data: payments = [], isLoading, refetch } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const refundMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/payments/${paymentId}/refund`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setShowRefundDialog(false);
      setRefundReason("");
      toast({ title: "Payment refunded", description: "The payment has been marked as refunded." });
    },
    onError: () => {
      toast({ title: "Refund failed", description: "Could not process the refund.", variant: "destructive" });
    },
  });

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      searchTerm === "" ||
      payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.gatewayOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.gatewayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesGateway = gatewayFilter === "all" || payment.gateway === gatewayFilter;

    let matchesDate = true;
    if (dateRange !== "all" && payment.createdAt) {
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();
      if (dateRange === "today") {
        matchesDate = paymentDate.toDateString() === now.toDateString();
      } else if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= weekAgo;
      } else if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesGateway && matchesDate;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isPaidOrCompleted = (status: string) => status === "paid" || status === "completed";
  
  const stats = {
    totalRevenue: payments.filter(p => isPaidOrCompleted(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0),
    totalTransactions: payments.length,
    paidTransactions: payments.filter(p => isPaidOrCompleted(p.status)).length,
    pendingTransactions: payments.filter(p => p.status === "pending" || p.status === "created").length,
    refundedTransactions: payments.filter(p => p.status === "refunded").length,
    razorpayRevenue: payments.filter(p => p.gateway === "razorpay" && isPaidOrCompleted(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0),
    stripeRevenue: payments.filter(p => p.gateway === "stripe" && isPaidOrCompleted(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0),
    taxCollected: payments.filter(p => isPaidOrCompleted(p.status)).reduce((sum, p) => sum + (p.taxAmount || 0), 0),
  };

  const formatAmount = (amount: number, currency: string = "INR") => {
    const value = amount / 100;
    if (currency === "INR") {
      return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" /> {status === "completed" ? "Completed" : "Paid"}</Badge>;
      case "pending":
      case "created":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-700"><RotateCcw className="w-3 h-3 mr-1" /> Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = async (paymentId: number) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/invoice`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: "Download failed", description: "Could not download invoice.", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Invoice #", "User ID", "Amount", "Tax", "Gateway", "Status", "Date"];
    const rows = filteredPayments.map(p => [
      p.id,
      p.invoiceNumber || "-",
      p.userId,
      (p.amount / 100).toFixed(2),
      (p.taxAmount / 100).toFixed(2),
      p.gateway,
      p.status,
      p.createdAt ? format(new Date(p.createdAt), "yyyy-MM-dd HH:mm") : "-"
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast({ title: "Export complete", description: `Exported ${filteredPayments.length} payments to CSV.` });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <IndianRupee className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{formatAmount(stats.totalRevenue, "INR")}</p>
            <p className="text-sm opacity-80">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0">
          <CardContent className="p-4">
            <CreditCard className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.paidTransactions}</p>
            <p className="text-sm opacity-80">Successful Payments</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
          <CardContent className="p-4">
            <Receipt className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{formatAmount(stats.taxCollected, "INR")}</p>
            <p className="text-sm opacity-80">Tax Collected</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-4">
            <Target className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">
              {stats.totalTransactions > 0 ? Math.round((stats.paidTransactions / stats.totalTransactions) * 100) : 0}%
            </p>
            <p className="text-sm opacity-80">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Razorpay Revenue</p>
              <p className="text-xl font-semibold">{formatAmount(stats.razorpayRevenue, "INR")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stripe Revenue</p>
              <p className="text-xl font-semibold">{formatAmount(stats.stripeRevenue, "USD")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100">
              <RotateCcw className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Refunded</p>
              <p className="text-xl font-semibold">{stats.refundedTransactions} transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>Manage and monitor all payment transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-payments">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export-payments">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice, order ID, or user..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
                data-testid="input-search-payments"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={handleFilterChange(setGatewayFilter)}>
              <SelectTrigger className="w-[150px]" data-testid="select-gateway-filter">
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={handleFilterChange(setDateRange)}>
              <SelectTrigger className="w-[150px]" data-testid="select-date-filter">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell className="font-mono text-sm">
                          {payment.invoiceNumber || `#${payment.id}`}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(payment.amount, payment.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatAmount(payment.taxAmount || 0, payment.currency)}
                          {payment.taxRate && <span className="text-xs ml-1">({payment.taxRate}%)</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {payment.gateway === "razorpay" ? (
                              <><IndianRupee className="w-3 h-3 mr-1" /> Razorpay</>
                            ) : (
                              <><DollarSign className="w-3 h-3 mr-1" /> Stripe</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.studentState && payment.studentCountry 
                            ? `${payment.studentState}, ${payment.studentCountry}`
                            : payment.studentCountry || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.paidAt 
                            ? format(new Date(payment.paidAt), "dd MMM yyyy HH:mm")
                            : payment.createdAt 
                              ? format(new Date(payment.createdAt), "dd MMM yyyy HH:mm")
                              : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${payment.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowDetailsDialog(true); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {isPaidOrCompleted(payment.status) && payment.invoiceNumber && (
                                <DropdownMenuItem onClick={() => handleDownloadInvoice(payment.id)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Download Invoice
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {isPaidOrCompleted(payment.status) && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => { setSelectedPayment(payment); setShowRefundDialog(true); }}
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Mark as Refunded
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              {selectedPayment?.invoiceNumber || `Payment #${selectedPayment?.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gateway</Label>
                    <p className="font-medium capitalize">{selectedPayment.gateway}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Amount Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Base Amount</Label>
                      <p className="font-medium">{formatAmount(selectedPayment.baseAmount, selectedPayment.currency)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tax ({selectedPayment.taxRate}%)</Label>
                      <p className="font-medium">{formatAmount(selectedPayment.taxAmount || 0, selectedPayment.currency)}</p>
                    </div>
                    {selectedPayment.cgstAmount > 0 && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">CGST</Label>
                          <p className="font-medium">{formatAmount(selectedPayment.cgstAmount, selectedPayment.currency)}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">SGST</Label>
                          <p className="font-medium">{formatAmount(selectedPayment.sgstAmount || 0, selectedPayment.currency)}</p>
                        </div>
                      </>
                    )}
                    {selectedPayment.igstAmount > 0 && (
                      <div>
                        <Label className="text-muted-foreground">IGST</Label>
                        <p className="font-medium">{formatAmount(selectedPayment.igstAmount, selectedPayment.currency)}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Total Amount</Label>
                      <p className="text-xl font-bold">{formatAmount(selectedPayment.amount, selectedPayment.currency)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Gateway Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Order ID</Label>
                      <p className="font-mono text-sm">{selectedPayment.gatewayOrderId || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Payment ID</Label>
                      <p className="font-mono text-sm">{selectedPayment.gatewayPaymentId || "-"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Customer Location</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Country</Label>
                      <p>{selectedPayment.studentCountry || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">State</Label>
                      <p>{selectedPayment.studentState || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Export Service</Label>
                      <p>{selectedPayment.isExportService ? "Yes (Tax Exempt)" : "No"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Timeline</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p>{selectedPayment.createdAt ? format(new Date(selectedPayment.createdAt), "dd MMM yyyy HH:mm:ss") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Paid</Label>
                      <p>{selectedPayment.paidAt ? format(new Date(selectedPayment.paidAt), "dd MMM yyyy HH:mm:ss") : "-"}</p>
                    </div>
                    {selectedPayment.refundedAt && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">Refunded</Label>
                          <p>{format(new Date(selectedPayment.refundedAt), "dd MMM yyyy HH:mm:ss")}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Refund Reason</Label>
                          <p>{selectedPayment.refundReason || "-"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            {selectedPayment && isPaidOrCompleted(selectedPayment.status) && selectedPayment.invoiceNumber && (
              <Button onClick={() => handleDownloadInvoice(selectedPayment.id)}>
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Mark as Refunded</DialogTitle>
            <DialogDescription>
              This will mark payment {selectedPayment?.invoiceNumber || `#${selectedPayment?.id}`} as refunded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Important</p>
                  <p className="text-sm text-amber-700">
                    This only marks the payment as refunded in the system. You must process the actual refund through your payment gateway dashboard (Razorpay/Stripe).
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Refund Reason</Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for refund..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPayment && refundMutation.mutate({ paymentId: selectedPayment.id, reason: refundReason })}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Mark as Refunded
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
