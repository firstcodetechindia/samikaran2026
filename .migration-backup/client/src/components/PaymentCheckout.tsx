import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  IndianRupee, 
  DollarSign, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Receipt,
  AlertCircle,
  Lock
} from "lucide-react";

interface StudentInfo {
  id: number;
  country?: string;
  state?: string;
}

interface PaymentCheckoutProps {
  examId: number;
  studentId: number;
  examTitle: string;
  examFee: number;
  currency?: string;
  studentCountry?: string;
  studentState?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PaymentSettings {
  razorpayEnabled: boolean;
  stripeEnabled: boolean;
  stripePublishableKey?: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxApplyIndiaOnly: boolean;
  environmentMode: string;
}

interface TaxBreakdown {
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  isExportService: boolean;
}

interface PaymentOrder {
  success: boolean;
  gateway: "razorpay" | "stripe";
  orderId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  paymentId: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentCheckout({
  examId,
  studentId,
  examTitle,
  examFee,
  currency = "INR",
  studentCountry,
  studentState,
  onSuccess,
  onCancel,
}: PaymentCheckoutProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<number | null>(null);

  const { data: settings } = useQuery<PaymentSettings>({
    queryKey: ["/api/sysctrl/payment-settings"],
  });

  // Fetch student info to get location for accurate tax calculation
  const { data: studentInfo } = useQuery<StudentInfo>({
    queryKey: ["/api/students", studentId],
    enabled: !!studentId && !studentCountry,
  });

  const effectiveCountry = studentCountry || studentInfo?.country || "IN";
  const effectiveState = studentState || studentInfo?.state;

  const { data: taxBreakdown } = useQuery<TaxBreakdown>({
    queryKey: ["/api/payments/calculate-tax", examFee, effectiveCountry, effectiveState],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/payments/calculate-tax", {
        baseAmount: examFee,
        country: effectiveCountry,
        state: effectiveState,
      });
      return res.json();
    },
    enabled: !!examFee,
  });

  const { data: razorpayKey } = useQuery<{ keyId: string }>({
    queryKey: ["/api/payment/razorpay-key"],
    enabled: settings?.razorpayEnabled,
  });

  useEffect(() => {
    if (settings?.razorpayEnabled && !document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [settings?.razorpayEnabled]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/create-order", {
        examId,
        studentId,
      });
      return res.json() as Promise<PaymentOrder>;
    },
    onSuccess: (data) => {
      setCurrentPaymentId(data.paymentId);
      if (data.gateway === "razorpay") {
        handleRazorpayPayment(data);
      } else if (data.gateway === "stripe") {
        handleStripePayment(data);
      }
    },
    onError: (error: any) => {
      setPaymentStatus("failed");
      setErrorMessage(error.message || "Failed to create payment order");
      setIsProcessing(false);
    },
  });

  const verifyRazorpayMutation = useMutation({
    mutationFn: async (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      paymentId: number;
    }) => {
      const res = await apiRequest("POST", "/api/payments/razorpay/verify", data);
      return res.json();
    },
    onSuccess: () => {
      setPaymentStatus("success");
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/exam-registrations"] });
      toast({
        title: "Payment successful",
        description: "Your exam registration is now unlocked!",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      setPaymentStatus("failed");
      setErrorMessage(error.message || "Payment verification failed");
      setIsProcessing(false);
    },
  });

  const retryPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await apiRequest("POST", `/api/payments/${paymentId}/retry`);
      return res.json() as Promise<PaymentOrder>;
    },
    onSuccess: (data) => {
      setPaymentStatus("processing");
      setErrorMessage(null);
      if (data.gateway === "razorpay") {
        handleRazorpayPayment(data);
      } else if (data.gateway === "stripe") {
        handleStripePayment(data);
      }
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to retry payment");
    },
  });

  const handleRazorpayPayment = (order: PaymentOrder) => {
    if (!window.Razorpay || !razorpayKey?.keyId) {
      setErrorMessage("Payment gateway not loaded. Please refresh the page.");
      setPaymentStatus("failed");
      setIsProcessing(false);
      return;
    }

    const options = {
      key: razorpayKey.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Samikaran Olympiad",
      description: `Exam Registration: ${examTitle}`,
      order_id: order.orderId,
      handler: function (response: any) {
        verifyRazorpayMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          paymentId: order.paymentId,
        });
      },
      prefill: {},
      theme: {
        color: "#8A2BE2",
      },
      modal: {
        ondismiss: function () {
          setPaymentStatus("failed");
          setErrorMessage("Payment was cancelled");
          setIsProcessing(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
      setPaymentStatus("failed");
      setErrorMessage(response.error?.description || "Payment failed");
      setIsProcessing(false);
    });
    rzp.open();
  };

  const handleStripePayment = async (order: PaymentOrder) => {
    // clientSecret contains the Stripe Checkout Session URL for redirect
    if (!order.clientSecret) {
      setErrorMessage("Payment session could not be created. Please try again.");
      setPaymentStatus("failed");
      setIsProcessing(false);
      return;
    }

    // Redirect to Stripe Checkout Session URL
    window.location.href = order.clientSecret;
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage(null);
    createOrderMutation.mutate();
  };

  const handleRetry = () => {
    if (currentPaymentId) {
      setIsProcessing(true);
      retryPaymentMutation.mutate(currentPaymentId);
    } else {
      handlePayNow();
    }
  };

  const formatAmount = (amount: number, curr: string = currency) => {
    const value = amount / 100;
    if (curr === "INR") {
      return `₹${value.toLocaleString("en-IN")}`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>{examTitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {settings?.environmentMode === "test" && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Test mode: No real money will be charged
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Base Amount</span>
            <span className="font-medium">{formatAmount(taxBreakdown?.baseAmount || examFee)}</span>
          </div>

          {settings?.taxEnabled && taxBreakdown && !taxBreakdown.isExportService && (
            <>
              {taxBreakdown.cgstAmount > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">CGST ({taxBreakdown.taxRate / 2}%)</span>
                    <span>{formatAmount(taxBreakdown.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">SGST ({taxBreakdown.taxRate / 2}%)</span>
                    <span>{formatAmount(taxBreakdown.sgstAmount)}</span>
                  </div>
                </>
              )}
              {taxBreakdown.igstAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">IGST ({taxBreakdown.taxRate}%)</span>
                  <span>{formatAmount(taxBreakdown.igstAmount)}</span>
                </div>
              )}
              {taxBreakdown.taxAmount > 0 && !taxBreakdown.cgstAmount && !taxBreakdown.igstAmount && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{settings.taxName} ({taxBreakdown.taxRate}%)</span>
                  <span>{formatAmount(taxBreakdown.taxAmount)}</span>
                </div>
              )}
            </>
          )}

          {taxBreakdown?.isExportService && (
            <div className="text-sm text-muted-foreground">
              Export of Service (0% tax)
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span className="text-primary">{formatAmount(taxBreakdown?.totalAmount || examFee)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Secure Payment
          </Badge>
          {settings?.razorpayEnabled && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              Razorpay
            </Badge>
          )}
          {settings?.stripeEnabled && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Stripe
            </Badge>
          )}
        </div>

        {paymentStatus === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment successful! Your exam access is now unlocked.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === "failed" && errorMessage && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {paymentStatus === "idle" && (
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayNow}
            disabled={isProcessing || !settings}
            data-testid="button-pay-now"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatAmount(taxBreakdown?.totalAmount || examFee)}
              </>
            )}
          </Button>
        )}

        {paymentStatus === "processing" && (
          <Button className="w-full" size="lg" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </Button>
        )}

        {paymentStatus === "success" && (
          <Button className="w-full" size="lg" variant="secondary" onClick={onSuccess}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue to Exam
          </Button>
        )}

        {paymentStatus === "failed" && (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleRetry}
              disabled={isProcessing}
              data-testid="button-retry-payment"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Payment
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function PaymentCheckoutDialog({
  open,
  onOpenChange,
  ...props
}: PaymentCheckoutProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Secure payment for your exam registration
          </DialogDescription>
        </DialogHeader>
        <PaymentCheckout {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
