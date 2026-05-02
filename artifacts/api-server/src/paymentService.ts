import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import { storage } from "./storage";
import type { Payment, PaymentSettings, StudentRegistration, Exam } from "@workspace/db";

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

interface PaymentOrderResult {
  gateway: "razorpay" | "stripe";
  orderId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  paymentId: number;
}

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private stripe: Stripe | null = null;
  private settings: PaymentSettings | null = null;

  async initialize(): Promise<void> {
    this.settings = (await storage.getPaymentSettings()) || null;
    
    if (this.settings?.razorpayEnabled && this.settings.razorpayKeyId && this.settings.razorpayKeySecret) {
      this.razorpay = new Razorpay({
        key_id: this.settings.razorpayKeyId,
        key_secret: this.settings.razorpayKeySecret,
      });
    }

    if (this.settings?.stripeEnabled && this.settings.stripeSecretKey) {
      this.stripe = new Stripe(this.settings.stripeSecretKey);
    }
  }

  async refreshSettings(): Promise<void> {
    await this.initialize();
  }

  getSettings(): PaymentSettings | null {
    return this.settings;
  }

  calculateTax(baseAmountPaise: number, country: string, studentState?: string): TaxBreakdown {
    const settings = this.settings;
    
    // Default: no tax
    const result: TaxBreakdown = {
      baseAmount: baseAmountPaise,
      taxRate: 0,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: baseAmountPaise,
      isExportService: false,
    };

    if (!settings?.taxEnabled) {
      return result;
    }

    // International payments = Export of Service (0% tax)
    if (settings.taxApplyIndiaOnly && country !== "IN") {
      result.isExportService = true;
      return result;
    }

    // Apply tax
    const taxRate = settings.taxRate || 18;
    const taxAmount = Math.round((baseAmountPaise * taxRate) / 100);
    
    result.taxRate = taxRate;
    result.taxAmount = taxAmount;
    result.totalAmount = baseAmountPaise + taxAmount;

    // India: Split into CGST/SGST or IGST
    if (country === "IN") {
      const businessState = settings.businessStateCode;
      
      if (businessState && studentState && businessState === studentState) {
        // Intra-state: CGST + SGST
        result.cgstAmount = Math.round(taxAmount / 2);
        result.sgstAmount = taxAmount - result.cgstAmount;
      } else {
        // Inter-state: IGST
        result.igstAmount = taxAmount;
      }
    }

    return result;
  }

  selectGateway(country: string): "razorpay" | "stripe" {
    if (country === "IN" && this.settings?.razorpayEnabled && this.razorpay) {
      return "razorpay";
    }
    if (this.settings?.stripeEnabled && this.stripe) {
      return "stripe";
    }
    // Fallback to razorpay for India if stripe not available
    if (country === "IN" && this.razorpay) {
      return "razorpay";
    }
    throw new Error("No payment gateway configured for this country");
  }

  async createPaymentOrder(
    exam: Exam,
    student: StudentRegistration,
    examRegistrationId: number
  ): Promise<PaymentOrderResult> {
    await this.refreshSettings();

    if (!this.settings) {
      throw new Error("Payment settings not configured");
    }

    const baseAmount = exam.participationFee || 0;
    const country = (student as any).countryCode || "IN";
    const studentState = (student as any).stateCode || "";
    const currency = country === "IN" ? "INR" : "USD";

    // Calculate tax
    const taxBreakdown = this.calculateTax(baseAmount, country, studentState);
    
    // Select gateway
    const gateway = this.selectGateway(country);

    // Create payment record
    const payment = await storage.createPayment({
      userId: student.id,
      userType: "student",
      examId: exam.id,
      olympiadId: exam.categoryId || undefined,
      studentId: student.id,
      gateway,
      baseAmount: taxBreakdown.baseAmount,
      amount: taxBreakdown.totalAmount,
      currency,
      taxRate: taxBreakdown.taxRate,
      taxAmount: taxBreakdown.taxAmount,
      cgstAmount: taxBreakdown.cgstAmount,
      sgstAmount: taxBreakdown.sgstAmount,
      igstAmount: taxBreakdown.igstAmount,
      isExportService: taxBreakdown.isExportService,
      country,
      state: studentState,
      status: "pending",
      environment: this.settings.environmentMode || "test",
      description: `Registration for ${exam.title}`,
    });

    if (gateway === "razorpay") {
      return this.createRazorpayOrder(payment, examRegistrationId);
    } else {
      return this.createStripePaymentIntent(payment, exam, student);
    }
  }

  private async createRazorpayOrder(
    payment: Payment,
    examRegistrationId: number
  ): Promise<PaymentOrderResult> {
    if (!this.razorpay) {
      throw new Error("Razorpay not initialized");
    }

    const order = await this.razorpay.orders.create({
      amount: payment.amount,
      currency: payment.currency || "INR",
      receipt: `exam_reg_${examRegistrationId}`,
      notes: {
        paymentId: payment.id.toString(),
        examId: payment.examId?.toString() || "",
        studentId: payment.studentId?.toString() || "",
      },
    });

    // Update payment with gateway order ID
    await storage.updatePayment(payment.id, {
      gatewayOrderId: order.id,
    });

    return {
      gateway: "razorpay",
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency || "INR",
      paymentId: payment.id,
    };
  }

  private async createStripePaymentIntent(
    payment: Payment,
    exam: Exam,
    student: StudentRegistration
  ): Promise<PaymentOrderResult> {
    if (!this.stripe) {
      throw new Error("Stripe not initialized");
    }

    // Convert paise to smallest currency unit (cents for USD)
    const amountInCents = payment.currency === "USD" 
      ? Math.round(payment.amount / 100 * 100) // Convert from paise to cents
      : payment.amount; // Already in paise for INR

    // Use Stripe Checkout Sessions for a redirect-based flow (more reliable)
    const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] 
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : process.env.REPL_URL || "http://localhost:5000";

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (payment.currency || "USD").toLowerCase(),
            product_data: {
              name: `Exam Registration: ${exam.title}`,
              description: `Registration fee for ${exam.title}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&paymentId=${payment.id}`,
      cancel_url: `${baseUrl}/payment/cancel?paymentId=${payment.id}`,
      customer_email: student.email || undefined,
      metadata: {
        paymentId: payment.id.toString(),
        examId: payment.examId?.toString() || "",
        studentId: payment.studentId?.toString() || "",
      },
    });

    // Update payment with gateway order ID (session ID)
    await storage.updatePayment(payment.id, {
      gatewayOrderId: session.id,
    });

    return {
      gateway: "stripe",
      paymentIntentId: session.id,
      clientSecret: session.url || undefined, // Use URL for redirect
      amount: payment.amount,
      currency: payment.currency || "USD",
      paymentId: payment.id,
    };
  }

  async verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    if (!this.settings?.razorpayKeySecret) {
      return false;
    }

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", this.settings.razorpayKeySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }

  async verifyRazorpayWebhookSignature(
    body: string,
    signature: string
  ): Promise<boolean> {
    if (!this.settings?.razorpayWebhookSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.settings.razorpayWebhookSecret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }

  async verifyStripeWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event | null> {
    if (!this.stripe || !this.settings?.stripeWebhookSecret) {
      return null;
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.settings.stripeWebhookSecret
      );
    } catch (err) {
      console.error("Stripe webhook verification failed:", err);
      return null;
    }
  }

  async handlePaymentSuccess(
    paymentId: number,
    gatewayPaymentId: string
  ): Promise<void> {
    const payment = await storage.updatePayment(paymentId, {
      status: "paid",
      gatewayPaymentId,
      paidAt: new Date(),
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (this.settings?.autoUnlockExamAfterPayment) {
      const registration = await storage.getExamRegistrationByPaymentId(paymentId);
      if (registration) {
        await storage.updateExamRegistrationPaymentStatus(registration.id, "unlocked");
      }
    }

    if (this.settings?.autoGenerateInvoice) {
      await this.generateInvoice(payment);
    }

    try {
      const { sendPaymentSuccessEmail } = await import("./email");
      let studentEmail = "";
      let studentName = "Student";
      let olympiadName = payment.description || "Olympiad Exam";

      const lookupId = payment.studentId || payment.userId;
      if (lookupId) {
        const student = await storage.getStudentById(lookupId);
        if (student) {
          studentEmail = student.email || "";
          studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
        }
      }

      if (studentEmail) {
        const amountStr = ((payment.amount || 0) / 100).toFixed(2);
        sendPaymentSuccessEmail(
          studentEmail,
          studentName,
          amountStr,
          payment.currency || "INR",
          olympiadName,
          gatewayPaymentId,
          payment.invoiceNumber || undefined
        ).catch(err => {
          console.error("[EMAIL] Failed to send payment success email:", err);
        });
      }
    } catch (err) {
      console.error("[EMAIL] Payment email lookup error:", err);
    }
  }

  async handlePaymentFailure(
    paymentId: number,
    reason: string
  ): Promise<void> {
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) return;

    const retryCount = (payment.retryCount || 0) + 1;
    const maxRetries = this.settings?.maxRetryAttempts || 3;

    await storage.updatePayment(paymentId, {
      status: retryCount >= maxRetries ? "failed" : "pending",
      failureReason: reason,
      retryCount,
    });
  }

  async generateInvoice(payment: Payment): Promise<string | null> {
    if (!this.settings) return null;

    try {
      const prefix = this.settings.invoicePrefix || "INV";
      const invoiceNumber = await storage.getNextInvoiceNumber(prefix);

      // Update payment with invoice number
      await storage.updatePayment(payment.id, {
        invoiceNumber,
      });

      // PDF generation will be implemented separately
      return invoiceNumber;
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      return null;
    }
  }

  async retryPayment(paymentId: number): Promise<PaymentOrderResult | null> {
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (!this.settings?.allowRetryOnFailure) {
      throw new Error("Payment retry is not allowed");
    }

    const maxRetries = this.settings.maxRetryAttempts || 3;
    if ((payment.retryCount || 0) >= maxRetries) {
      throw new Error("Maximum retry attempts exceeded");
    }

    // Reset payment status
    await storage.updatePayment(paymentId, {
      status: "pending",
      gatewayOrderId: null,
      gatewayPaymentId: null,
      failureReason: null,
    });

    // Get exam and student
    if (!payment.examId || !payment.studentId) {
      throw new Error("Invalid payment data");
    }

    const exam = await storage.getExam(payment.examId);
    const student = await storage.getStudentById(payment.studentId);

    if (!exam || !student) {
      throw new Error("Exam or student not found");
    }

    const registration = await storage.getExamRegistrationByPaymentId(paymentId);
    if (!registration) {
      throw new Error("Exam registration not found");
    }

    // Create new order
    return this.createPaymentOrder(exam, student, registration.id);
  }
}

export const paymentService = new PaymentService();
