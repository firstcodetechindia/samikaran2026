import PDFDocument from "pdfkit";
import { storage } from "./storage";
import type { Payment, PaymentSettings, Exam, StudentRegistration } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

interface InvoiceData {
  payment: Payment;
  settings: PaymentSettings;
  exam?: Exam;
  student?: StudentRegistration;
}

export async function generateInvoicePDF(paymentId: number): Promise<Buffer | null> {
  try {
    const payment = await storage.getPaymentById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    const settings = await storage.getPaymentSettings();
    if (!settings) {
      throw new Error("Payment settings not configured");
    }

    let exam: Exam | undefined;
    let student: StudentRegistration | undefined;

    if (payment.examId) {
      exam = await storage.getExam(payment.examId);
    }
    if (payment.studentId) {
      student = await storage.getStudentById(payment.studentId);
    }

    const invoiceNumber = payment.invoiceNumber || await storage.getNextInvoiceNumber(settings.invoicePrefix || "INV");
    
    if (!payment.invoiceNumber) {
      await storage.updatePayment(paymentId, { invoiceNumber });
    }

    return createInvoicePDF({
      payment: { ...payment, invoiceNumber },
      settings,
      exam,
      student,
    });
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    return null;
  }
}

function createInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { payment, settings, exam, student } = data;
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Use template settings for formatting
    const currencyPosition = settings.invoiceCurrencyPosition || "before";
    const dateFormat = settings.invoiceDateFormat || "DD/MM/YYYY";
    
    const formatAmount = (amount: number, currency: string = "INR") => {
      const value = amount / 100;
      const symbol = currency === "INR" ? "₹" : "$";
      const formatted = currency === "INR" 
        ? value.toLocaleString("en-IN", { minimumFractionDigits: 2 })
        : value.toLocaleString("en-US", { minimumFractionDigits: 2 });
      return currencyPosition === "before" ? `${symbol}${formatted}` : `${formatted}${symbol}`;
    };

    const formatDate = (date: Date | string | null) => {
      if (!date) return "-";
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const monthName = d.toLocaleString("en-US", { month: "short" });
      const year = d.getFullYear();
      
      switch (dateFormat) {
        case "MM/DD/YYYY": return `${month}/${day}/${year}`;
        case "YYYY-MM-DD": return `${year}-${month}-${day}`;
        case "DD MMM YYYY": return `${day} ${monthName} ${year}`;
        default: return `${day}/${month}/${year}`;
      }
    };

    // Use template colors from settings
    const primaryColor = settings.invoicePrimaryColor || "#8A2BE2";
    const textColor = settings.invoiceSecondaryColor || "#333333";
    const mutedColor = "#666666";

    // Header with logo/brand
    const layout = settings.invoiceLayout || "classic";
    
    if (layout === "modern") {
      // Modern layout with accent bar
      doc.rect(0, 0, 595, 8).fill(primaryColor);
    }

    doc.fontSize(24)
      .fillColor(primaryColor)
      .text("SAMIKARAN", 50, layout === "modern" ? 20 : 50, { continued: true })
      .fontSize(12)
      .text(".");
    
    doc.fontSize(10)
      .fillColor(mutedColor)
      .text("OLYMPIAD", 50, layout === "modern" ? 45 : 75);

    if (settings.invoiceCompanyTagline) {
      doc.fontSize(8)
        .fillColor(mutedColor)
        .text(settings.invoiceCompanyTagline, 50, layout === "modern" ? 58 : 88);
    }

    doc.fontSize(20)
      .fillColor(textColor)
      .text("TAX INVOICE", 400, layout === "modern" ? 20 : 50, { align: "right" });

    doc.moveTo(50, 110)
      .lineTo(545, 110)
      .strokeColor("#e0e0e0")
      .stroke();

    let y = 130;

    doc.fontSize(10)
      .fillColor(mutedColor)
      .text("Invoice Number:", 50, y)
      .fillColor(textColor)
      .text(payment.invoiceNumber || "-", 150, y);
    
    y += 15;
    doc.fillColor(mutedColor)
      .text("Invoice Date:", 50, y)
      .fillColor(textColor)
      .text(formatDate(payment.paidAt || payment.createdAt), 150, y);

    y += 15;
    doc.fillColor(mutedColor)
      .text("Payment Status:", 50, y)
      .fillColor(payment.status === "paid" ? "#22c55e" : "#ef4444")
      .text(payment.status?.toUpperCase() || "PENDING", 150, y);

    if (settings.businessName || settings.gstin) {
      doc.fontSize(10)
        .fillColor(mutedColor)
        .text("From:", 350, 130);
      
      let fromY = 145;
      if (settings.businessName) {
        doc.fontSize(11)
          .fillColor(textColor)
          .text(settings.businessName, 350, fromY, { width: 200 });
        fromY += 15;
      }
      if (settings.businessAddress) {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(settings.businessAddress, 350, fromY, { width: 200 });
        fromY += 30;
      }
      if (settings.gstin) {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(`GSTIN: ${settings.gstin}`, 350, fromY);
      }
    }

    y = 220;
    doc.fontSize(10)
      .fillColor(mutedColor)
      .text("Bill To:", 50, y);
    
    y += 15;
    if (student) {
      const studentName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ");
      doc.fontSize(11)
        .fillColor(textColor)
        .text(studentName || "Student", 50, y);
      y += 15;
      if (student.email) {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(student.email, 50, y);
        y += 12;
      }
      if (student.phone) {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(student.phone, 50, y);
        y += 12;
      }
    }

    y = 310;
    doc.moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .stroke();

    y += 10;
    doc.fontSize(10)
      .fillColor(mutedColor)
      .text("Description", 50, y)
      .text("Amount", 450, y, { align: "right", width: 95 });

    y += 20;
    doc.moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .stroke();

    y += 15;
    doc.fontSize(10)
      .fillColor(textColor)
      .text(exam ? `Exam Registration: ${exam.title}` : "Exam Registration Fee", 50, y, { width: 350 })
      .text(formatAmount(payment.baseAmount, payment.currency || "INR"), 450, y, { align: "right", width: 95 });

    y += 25;

    if (settings.showTaxBreakdown && payment.taxAmount && payment.taxAmount > 0) {
      if (payment.cgstAmount && payment.cgstAmount > 0) {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(`CGST @ ${(payment.taxRate || 18) / 2}%`, 50, y)
          .text(formatAmount(payment.cgstAmount, payment.currency || "INR"), 450, y, { align: "right", width: 95 });
        y += 15;
        
        doc.text(`SGST @ ${(payment.taxRate || 18) / 2}%`, 50, y)
          .text(formatAmount(payment.sgstAmount || 0, payment.currency || "INR"), 450, y, { align: "right", width: 95 });
        y += 15;
      } else if (payment.igstAmount && payment.igstAmount > 0) {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(`IGST @ ${payment.taxRate || 18}%`, 50, y)
          .text(formatAmount(payment.igstAmount, payment.currency || "INR"), 450, y, { align: "right", width: 95 });
        y += 15;
      } else {
        doc.fontSize(9)
          .fillColor(mutedColor)
          .text(`${settings.taxName || "Tax"} @ ${payment.taxRate || 18}%`, 50, y)
          .text(formatAmount(payment.taxAmount, payment.currency || "INR"), 450, y, { align: "right", width: 95 });
        y += 15;
      }
    }

    if (payment.isExportService) {
      doc.fontSize(9)
        .fillColor(mutedColor)
        .text("Export of Service (Tax Exempt)", 50, y);
      y += 15;
    }

    y += 10;
    doc.moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .stroke();

    y += 15;
    doc.fontSize(12)
      .fillColor(textColor)
      .text("Total Amount", 50, y, { bold: true })
      .fillColor(primaryColor)
      .text(formatAmount(payment.amount, payment.currency || "INR"), 450, y, { align: "right", width: 95 });

    // Payment details section (conditional)
    if (settings.invoiceShowPaymentDetails !== false) {
      y += 50;
      doc.fontSize(9)
        .fillColor(mutedColor)
        .text("Payment Details:", 50, y);
      
      y += 15;
      doc.text(`Gateway: ${payment.gateway?.toUpperCase() || "-"}`, 50, y);
      y += 12;
      doc.text(`Transaction ID: ${payment.gatewayPaymentId || "-"}`, 50, y);
      y += 12;
      doc.text(`Order ID: ${payment.gatewayOrderId || "-"}`, 50, y);
    }

    // Terms and conditions section
    if (settings.invoiceTermsAndConditions) {
      y = 620;
      doc.fontSize(8)
        .fillColor(mutedColor)
        .text("Terms & Conditions:", 50, y);
      y += 12;
      doc.fontSize(7)
        .text(settings.invoiceTermsAndConditions, 50, y, { width: 495 });
    }

    // Footer notes
    if (settings.invoiceFooterNotes) {
      y = 720;
      doc.fontSize(8)
        .fillColor(mutedColor)
        .text(settings.invoiceFooterNotes, 50, y, { width: 495, align: "center" });
    }

    // Footer line and signature note
    y = 760;
    doc.moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#e0e0e0")
      .stroke();

    y += 10;
    doc.fontSize(8)
      .fillColor(mutedColor)
      .text("This is a computer-generated invoice and does not require a signature.", 50, y, { align: "center", width: 495 });

    doc.end();
  });
}

export async function getInvoiceForPayment(paymentId: number): Promise<Buffer | null> {
  return generateInvoicePDF(paymentId);
}

// Generate registration invoice without a payment record
export async function generateRegistrationInvoice(data: {
  studentName: string;
  studentId: string;
  studentEmail: string;
  examTitle: string;
  examSubject: string;
  examDate: string;
  amount: number;
  currency?: string;
  invoiceNumber?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = "#8A2BE2";
    const accentColor = "#EC4899";
    const darkColor = "#1a1a2e";
    const invoiceNumber = data.invoiceNumber || `SAM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const currency = data.currency || 'INR';
    const gst = Math.round(data.amount * 0.18);
    const total = data.amount + gst;

    const formatCurrency = (amt: number) => {
      if (currency === 'INR') {
        return `Rs. ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `USD ${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Gradient header background
    const gradient = doc.linearGradient(0, 0, 595, 0);
    gradient.stop(0, primaryColor).stop(1, accentColor);
    doc.rect(0, 0, 595, 140).fill(gradient);

    // White decorative circles
    doc.circle(500, 30, 80).fillOpacity(0.1).fill("#ffffff");
    doc.circle(550, 100, 50).fillOpacity(0.05).fill("#ffffff");
    doc.fillOpacity(1);

    // Company name
    doc.fontSize(28).fillColor("#ffffff").font("Helvetica-Bold")
      .text("SAMIKARAN", 50, 45);
    doc.fontSize(12).fillColor("#ffffff").font("Helvetica")
      .text("OLYMPIAD", 50, 78);

    // Invoice badge
    doc.roundedRect(380, 35, 170, 60, 8).fill("#ffffff");
    doc.fontSize(10).fillColor("#666666").font("Helvetica")
      .text("INVOICE", 390, 45, { width: 150, align: "center" });
    doc.fontSize(10).fillColor(primaryColor).font("Helvetica-Bold")
      .text(invoiceNumber, 390, 65, { width: 150, align: "center" });

    // Invoice info section
    doc.rect(0, 140, 595, 60).fill("#faf5ff");
    
    doc.fontSize(9).fillColor("#666666").font("Helvetica")
      .text("INVOICE DATE", 50, 155);
    doc.fontSize(11).fillColor(darkColor).font("Helvetica-Bold")
      .text(invoiceDate, 50, 170);

    doc.fontSize(9).fillColor("#666666").font("Helvetica")
      .text("PAYMENT STATUS", 200, 155);
    doc.roundedRect(200, 168, 60, 20, 4).fill("#dcfce7");
    doc.fontSize(10).fillColor("#16a34a").font("Helvetica-Bold")
      .text("PAID", 210, 173);

    doc.fontSize(9).fillColor("#666666").font("Helvetica")
      .text("PAYMENT METHOD", 350, 155);
    doc.fontSize(11).fillColor(darkColor).font("Helvetica-Bold")
      .text(currency === 'INR' ? "Razorpay" : "Stripe", 350, 170);

    // Bill To & Olympiad Details
    const y1 = 230;
    
    // Bill To Box
    doc.roundedRect(50, y1, 240, 130, 10).lineWidth(1).stroke("#e5e7eb");
    doc.fontSize(10).fillColor(primaryColor).font("Helvetica-Bold")
      .text("BILL TO", 65, y1 + 15);
    doc.moveTo(65, y1 + 32).lineTo(120, y1 + 32).lineWidth(2).stroke(primaryColor);
    
    doc.fontSize(14).fillColor(darkColor).font("Helvetica-Bold")
      .text(data.studentName, 65, y1 + 45);
    doc.fontSize(10).fillColor("#666666").font("Helvetica")
      .text(data.studentEmail, 65, y1 + 70);
    
    doc.roundedRect(65, y1 + 90, 200, 25, 5).fill("#f3f4f6");
    doc.fontSize(9).fillColor("#666666").font("Helvetica")
      .text("Student ID:", 75, y1 + 98);
    doc.fillColor(primaryColor).font("Helvetica-Bold")
      .text(data.studentId, 140, y1 + 98);

    // Olympiad Box
    doc.roundedRect(310, y1, 240, 130, 10).lineWidth(1).stroke("#e5e7eb");
    doc.fontSize(10).fillColor(accentColor).font("Helvetica-Bold")
      .text("OLYMPIAD DETAILS", 325, y1 + 15);
    doc.moveTo(325, y1 + 32).lineTo(435, y1 + 32).lineWidth(2).stroke(accentColor);
    
    doc.fontSize(12).fillColor(darkColor).font("Helvetica-Bold")
      .text(data.examTitle, 325, y1 + 45, { width: 210 });
    doc.fontSize(10).fillColor("#666666").font("Helvetica")
      .text(`Subject: ${data.examSubject}`, 325, y1 + 80);
    
    doc.roundedRect(325, y1 + 100, 200, 20, 5).fill("#fdf4ff");
    doc.fontSize(9).fillColor(accentColor).font("Helvetica-Bold")
      .text(`Exam Date: ${data.examDate}`, 335, y1 + 106);

    // Items Table
    const tableY = 390;
    
    // Table header with gradient
    const tableGradient = doc.linearGradient(50, tableY, 545, tableY);
    tableGradient.stop(0, primaryColor).stop(1, accentColor);
    doc.roundedRect(50, tableY, 495, 35, 5).fill(tableGradient);
    
    doc.fontSize(10).fillColor("#ffffff").font("Helvetica-Bold")
      .text("DESCRIPTION", 70, tableY + 12)
      .text("QTY", 320, tableY + 12)
      .text("RATE", 380, tableY + 12)
      .text("AMOUNT", 460, tableY + 12, { width: 75, align: "right" });

    // Table row 1
    doc.rect(50, tableY + 35, 495, 40).fill("#ffffff");
    doc.fontSize(10).fillColor(darkColor).font("Helvetica")
      .text("Olympiad Registration Fee", 70, tableY + 50)
      .text("1", 330, tableY + 50)
      .text(formatCurrency(data.amount), 370, tableY + 50)
      .text(formatCurrency(data.amount), 460, tableY + 50, { width: 75, align: "right" });

    // Divider
    doc.moveTo(50, tableY + 75).lineTo(545, tableY + 75).lineWidth(1).stroke("#e5e7eb");

    // Table row 2 - GST
    doc.rect(50, tableY + 75, 495, 40).fill("#fafafa");
    doc.fontSize(10).fillColor(darkColor).font("Helvetica")
      .text("GST @ 18%", 70, tableY + 90)
      .text("—", 330, tableY + 90)
      .text("18%", 380, tableY + 90)
      .text(formatCurrency(gst), 460, tableY + 90, { width: 75, align: "right" });

    // Total Section
    const totalY = tableY + 130;
    doc.roundedRect(350, totalY, 195, 55, 8).fill("#f0fdf4");
    doc.fontSize(10).fillColor("#666666").font("Helvetica")
      .text("SUBTOTAL", 365, totalY + 10);
    doc.fontSize(11).fillColor(darkColor).font("Helvetica")
      .text(formatCurrency(data.amount), 460, totalY + 10, { width: 75, align: "right" });
    
    doc.moveTo(365, totalY + 28).lineTo(530, totalY + 28).lineWidth(1).stroke("#bbf7d0");
    
    doc.fontSize(12).fillColor("#16a34a").font("Helvetica-Bold")
      .text("TOTAL PAID", 365, totalY + 36);
    doc.fontSize(14).fillColor("#16a34a").font("Helvetica-Bold")
      .text(formatCurrency(total), 450, totalY + 34, { width: 85, align: "right" });

    // Footer
    const footerY = 720;
    doc.rect(0, footerY, 595, 122).fill("#1a1a2e");
    
    doc.fontSize(11).fillColor("#ffffff").font("Helvetica-Bold")
      .text("Thank you for choosing Samikaran Olympiad!", 50, footerY + 25, { align: "center", width: 495 });
    
    doc.fontSize(9).fillColor("#9ca3af").font("Helvetica")
      .text("For any queries, please contact us at:", 50, footerY + 50, { align: "center", width: 495 });
    
    doc.fontSize(10).fillColor("#a78bfa").font("Helvetica")
      .text("support@samikaranolympiad.com  |  www.samikaranolympiad.com", 50, footerY + 68, { align: "center", width: 495 });
    
    doc.fontSize(8).fillColor("#6b7280").font("Helvetica")
      .text("This is a computer-generated invoice and does not require a signature.", 50, footerY + 95, { align: "center", width: 495 });

    doc.end();
  });
}
