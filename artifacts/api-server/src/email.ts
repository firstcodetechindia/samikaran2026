import { storage } from "./storage";
import nodemailer from "nodemailer";
import { db } from "./db";
import { emailSends } from "@workspace/db";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}

interface EmailConfig {
  provider: string;
  apiKey: string;
  fromName: string;
  fromEmail: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEncryption?: string;
}

async function getEmailConfig(): Promise<EmailConfig> {
  const settings = await storage.getSettingsByCategory("email");
  const get = (key: string) => settings.find(s => s.key === key)?.value || "";

  return {
    provider: get("email_provider") || "brevo",
    apiKey: get("email_api_key"),
    fromName: get("email_from_name") || "Samikaran Olympiad",
    fromEmail: get("email_from_address") || "noreply@samikaranolympiad.com",
    smtpHost: get("smtp_host"),
    smtpPort: get("smtp_port"),
    smtpUsername: get("smtp_username"),
    smtpPassword: get("smtp_password"),
    smtpEncryption: get("smtp_encryption"),
  };
}

function createTransport(config: EmailConfig) {
  const { provider, apiKey, smtpHost, smtpPort, smtpUsername, smtpPassword, smtpEncryption } = config;

  if (provider === "sendgrid") {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: { user: "apikey", pass: apiKey },
    });
  }

  if (provider === "mailgun") {
    return nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: { user: smtpUsername || "postmaster@mg.samikaranolympiad.com", pass: apiKey },
    });
  }

  if (provider === "ses") {
    return nodemailer.createTransport({
      host: smtpHost || "email-smtp.ap-south-1.amazonaws.com",
      port: parseInt(smtpPort || "587", 10),
      secure: false,
      auth: { user: smtpUsername || apiKey, pass: smtpPassword || apiKey },
    });
  }

  if (provider === "gmail") {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUsername, pass: smtpPassword || "" },
    });
  }

  if (provider === "smtp") {
    const port = parseInt(smtpPort || "587", 10);
    return nodemailer.createTransport({
      host: smtpHost || "localhost",
      port,
      secure: smtpEncryption === "ssl" || port === 465,
      auth: smtpUsername ? { user: smtpUsername, pass: smtpPassword || "" } : undefined,
    });
  }

  return null;
}

async function sendViaBrevoSMTP(options: EmailOptions, config: EmailConfig): Promise<boolean> {
  const fromName = options.fromName || config.fromName;
  const fromEmail = options.fromEmail || config.fromEmail;
  const smtpLogin = config.smtpUsername;
  const smtpKey = config.smtpPassword || config.apiKey;

  if (!smtpLogin || !smtpKey) {
    lastEmailError = `Brevo SMTP: Missing SMTP Login (${smtpLogin ? 'OK' : 'MISSING'}) or SMTP Key (${smtpKey ? 'OK' : 'MISSING'}). Go to Global Settings > Email and fill both SMTP Login and SMTP Key fields.`;
    console.error(`[EMAIL] ${lastEmailError}`);
    return false;
  }

  console.log(`[EMAIL] Sending via Brevo SMTP to: ${options.to} | login: ${smtpLogin} | key: ${smtpKey.substring(0, 8)}...`);

  try {
    const transport = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpLogin,
        pass: smtpKey,
      },
    });

    await transport.verify();
    console.log(`[EMAIL] SMTP connection verified successfully`);

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[EMAIL] Brevo SMTP success! MessageId: ${info.messageId} | Response: ${info.response}`);
    await logEmailSend(options.to, options.subject, "sent", "brevo-smtp", undefined, undefined, undefined, fromEmail, fromName);
    return true;
  } catch (error: any) {
    lastEmailError = `Brevo SMTP error: ${error.message || String(error)}`;
    console.error(`[EMAIL] ${lastEmailError}`);
    await logEmailSend(options.to, options.subject, "failed", "brevo-smtp", undefined, undefined, lastEmailError, fromEmail, fromName);
    return false;
  }
}

async function sendViaBrevoAPI(options: EmailOptions, config: EmailConfig): Promise<boolean> {
  const fromName = options.fromName || config.fromName;
  const fromEmail = options.fromEmail || config.fromEmail;

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
  };

  try {
    console.log(`[EMAIL] Sending via Brevo API to: ${options.to} | key: ${config.apiKey?.substring(0, 10)}...`);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log(`[EMAIL] Brevo API success: ${responseText}`);
      await logEmailSend(options.to, options.subject, "sent", "brevo", undefined, undefined, undefined, fromEmail, fromName);
      return true;
    } else {
      lastEmailError = `Brevo API ${response.status}: ${responseText}`;
      console.error(`[EMAIL] ${lastEmailError}`);
      await logEmailSend(options.to, options.subject, "failed", "brevo", undefined, undefined, lastEmailError, fromEmail, fromName);
      return false;
    }
  } catch (error: any) {
    lastEmailError = `Brevo exception: ${error.message || String(error)}`;
    console.error(`[EMAIL] ${lastEmailError}`);
    await logEmailSend(options.to, options.subject, "failed", "brevo", undefined, undefined, lastEmailError, fromEmail, fromName);
    return false;
  }
}

async function logEmailSend(
  recipientEmail: string,
  subject: string,
  status: string,
  provider: string,
  recipientName?: string,
  templateId?: number,
  errorMessage?: string,
  fromEmail?: string,
  fromName?: string
) {
  try {
    await db.insert(emailSends).values({
      recipientEmail,
      recipientName: recipientName || null,
      subject,
      status,
      provider,
      templateId: templateId || null,
      fromEmail: fromEmail || null,
      fromName: fromName || null,
      replyTo: null,
      errorMessage: errorMessage || null,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to log email send:", err);
  }
}

let lastEmailError = "";

export function getLastEmailError(): string {
  return lastEmailError;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  lastEmailError = "";
  const config = await getEmailConfig();

  console.log(`[EMAIL] Config: provider=${config.provider} | apiKey=${config.apiKey ? config.apiKey.substring(0, 12) + '...' : 'EMPTY'} | smtpUser=${config.smtpUsername || 'EMPTY'} | from=${config.fromEmail}`);

  if (!config.apiKey && config.provider !== "smtp" && config.provider !== "gmail") {
    lastEmailError = "No API key configured for email provider. Go to Global Settings > Email and enter your API key.";
    console.error(`[EMAIL] ${lastEmailError}`);
    await logEmailSend(options.to, options.subject, "failed", "none", undefined, undefined, lastEmailError, config.fromEmail, config.fromName);
    return false;
  }

  if (config.provider === "brevo") {
    const smtpResult = await sendViaBrevoSMTP(options, config);
    if (smtpResult) return true;
    console.log(`[EMAIL] Brevo SMTP failed, trying API method...`);
    return sendViaBrevoAPI(options, config);
  }

  const transport = createTransport(config);
  if (!transport) {
    lastEmailError = `Unsupported provider: ${config.provider}`;
    console.error(`[EMAIL] ${lastEmailError}`);
    await logEmailSend(options.to, options.subject, "failed", config.provider, undefined, undefined, lastEmailError, config.fromEmail, config.fromName);
    return false;
  }

  try {
    const fromName = options.fromName || config.fromName;
    const fromEmail = options.fromEmail || config.fromEmail;

    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[EMAIL] Sent to: ${options.to} | Subject: ${options.subject}`);
    await logEmailSend(options.to, options.subject, "sent", config.provider, undefined, undefined, undefined, fromEmail, fromName);
    return true;
  } catch (error: any) {
    lastEmailError = error.message || String(error);
    console.error(`[EMAIL] Failed to send to ${options.to}:`, lastEmailError);
    await logEmailSend(options.to, options.subject, "failed", config.provider, undefined, undefined, lastEmailError, config.fromEmail, config.fromName);
    return false;
  }
}

export function renderTemplate(htmlContent: string, variables: Record<string, string>): string {
  let html = htmlContent;
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return html;
}

export async function sendTemplatedEmail(
  eventType: string,
  to: string,
  variables: Record<string, string>,
  recipientName?: string
): Promise<boolean> {
  try {
    const assignment = await storage.getEmailTemplateAssignment(eventType);
    if (!assignment || !assignment.templateId || !assignment.isActive) {
      console.log(`[EMAIL] No active assignment for event: ${eventType}. Skipping.`);
      return false;
    }

    const template = await storage.getEmailTemplate(assignment.templateId);
    if (!template || !template.isActive) {
      console.log(`[EMAIL] Template ${assignment.templateId} not found or inactive.`);
      return false;
    }

    const html = renderTemplate(template.htmlContent, variables);
    const subject = renderTemplate(template.subject, variables);

    const success = await sendEmail({ to, subject, html });

    if (success) {
      await logEmailSend(to, subject, "sent", "template", recipientName, template.id);
    }

    return success;
  } catch (error) {
    console.error(`[EMAIL] sendTemplatedEmail error for ${eventType}:`, error);
    return false;
  }
}

interface SocialLink {
  platformCode: string;
  platformName: string;
  pageUrl: string | null;
  isActive: boolean | null;
}

const socialIconLabels: Record<string, string> = {
  facebook: "f",
  instagram: "in",
  x: "X",
  twitter: "X",
  linkedin: "in",
  youtube: "▶",
  whatsapp: "W",
  telegram: "✈",
};

const socialBgColors: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  x: "#000000",
  twitter: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  telegram: "#26A5E4",
};

async function getSocialLinksForEmail(): Promise<SocialLink[]> {
  try {
    const links = await storage.getSocialMediaLinks();
    return links;
  } catch {
    return [];
  }
}

function buildSocialIconsHtml(links: SocialLink[]): string {
  const activeLinks = links.filter(l => l.isActive && l.pageUrl);
  if (activeLinks.length === 0) return "";

  const icons = activeLinks.map(link => {
    const url = link.pageUrl || "#";
    const label = socialIconLabels[link.platformCode] || link.platformName.charAt(0);
    const bg = socialBgColors[link.platformCode] || "#6b7280";
    return `<a href="${url}" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:${bg};color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-align:center;line-height:36px;margin:0 4px;text-decoration:none;vertical-align:middle;" title="${link.platformName}">${label}</a>`;
  }).join("");

  return `<p style="margin: 12px 0 6px 0; font-size: 12px; color: #9ca3af;">Follow us</p>
      <div style="margin: 0 0 12px 0;">${icons}</div>`;
}

async function brandedEmailWrapper(title: string, bodyContent: string): Promise<string> {
  const year = new Date().getFullYear();
  const socialLinks = await getSocialLinksForEmail();
  const socialHtml = buildSocialIconsHtml(socialLinks);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8A2BE2 0%, #FF2FBF 100%); padding: 32px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 2px; }
    .header .tagline { color: rgba(255,255,255,0.9); margin: 4px 0 0 0; font-size: 16px; font-weight: 500; letter-spacing: 1px; }
    .content { padding: 32px 28px; }
    .content h2 { color: #1f2937; margin-top: 0; font-size: 22px; }
    .content p { color: #4b5563; font-size: 15px; margin: 12px 0; }
    .otp-box { background: linear-gradient(135deg, #8A2BE2, #FF2FBF); color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: 12px; text-align: center; padding: 20px; border-radius: 10px; margin: 24px 0; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 6px 0; font-size: 14px; }
    .info-box strong { color: #1f2937; }
    .btn { display: inline-block; background: linear-gradient(135deg, #8A2BE2, #FF2FBF); color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px 20px; text-align: center; font-size: 12px; }
    .footer a { color: #a78bfa; text-decoration: none; }
    .footer p { margin: 4px 0; }
    .warning { color: #dc2626; font-size: 13px; font-weight: 500; }
    ul { padding-left: 20px; }
    ul li { color: #4b5563; font-size: 14px; margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SAMIKARAN.</h1>
      <div class="tagline">Olympiad</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      ${socialHtml}
      <p><strong style="color:#a78bfa;">SAMIKARAN.</strong> Olympiad</p>
      <p>&copy; ${year} Samikaran Olympiad. All rights reserved.</p>
      <p><a href="https://www.samikaranolympiad.com">www.samikaranolympiad.com</a></p>
      <p style="margin-top: 8px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOtpEmail(email: string, otp: string, purpose: string = "verification"): Promise<boolean> {
  let purposeText = "verify your identity";
  let subjectText = "Your Verification Code";
  
  if (purpose === "login") {
    purposeText = "log in to your account";
    subjectText = "Your Login OTP";
  } else if (purpose === "registration") {
    purposeText = "complete your registration";
    subjectText = "Verify Your Email";
  } else if (purpose === "forgot_password") {
    purposeText = "reset your password";
    subjectText = "Password Reset Code";
  } else if (purpose === "admin_login") {
    purposeText = "access the Admin Panel";
    subjectText = "Admin Login OTP";
  } else if (purpose === "terminal_access") {
    purposeText = "access the Secure Terminal";
    subjectText = "Terminal Access OTP";
  }

  const html = await brandedEmailWrapper(subjectText, `
      <h2>Verification Code</h2>
      <p>Use the following OTP to ${purposeText}:</p>
      <div class="otp-box">${otp}</div>
      <p class="warning">This code expires in 5 minutes. Do not share this code with anyone.</p>
      <hr class="divider">
      <p style="font-size: 13px; color: #6b7280;">If you didn't request this code, please ignore this email. Your account is safe.</p>
  `);

  return sendEmail({
    to: email,
    subject: `${subjectText} - ${otp} | Samikaran Olympiad`,
    html,
    text: `Your Samikaran Olympiad ${subjectText} is: ${otp}. This code expires in 5 minutes. Do not share it with anyone.`,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  accountType: string,
  studentId?: string
): Promise<boolean> {
  let typeLabel = "Student";
  let extraInfo = "";
  let welcomeMessage = "";
  let nextSteps = "";

  if (accountType === "school") {
    typeLabel = "School Partner";
    welcomeMessage = `<p>Thank you for partnering with <strong>Samikaran Olympiad</strong>! Your School Partner account has been created successfully.</p>`;
    extraInfo = `<p>As a School Partner, you can register your students for olympiads, track their performance, and manage bulk enrollments from your school dashboard.</p>`;
    nextSteps = `
      <ul>
        <li>Register students in bulk for olympiad exams</li>
        <li>Track student performance and analytics</li>
        <li>Access special pricing for group registrations</li>
        <li>Download school-level performance reports</li>
      </ul>`;
  } else if (accountType === "supervisor") {
    typeLabel = "Supervisor";
    welcomeMessage = `<p>You have successfully registered as a <strong>Supervisor / Parent</strong> on <strong>Samikaran Olympiad</strong>.</p>`;
    extraInfo = `<p>As a Supervisor, you can manage students, monitor exam progress, and access performance analytics from your dashboard.</p>`;
    nextSteps = `
      <ul>
        <li>Add and manage your students</li>
        <li>Monitor exam progress in real-time</li>
        <li>Access performance analytics and reports</li>
        <li>Register students for upcoming olympiads</li>
      </ul>`;
  } else if (accountType === "group" || accountType === "partner") {
    typeLabel = "Group/Partner";
    welcomeMessage = `<p>Your Partner account on <strong>Samikaran Olympiad</strong> has been activated.</p>`;
    extraInfo = `<p>As a Partner, you can refer students, manage your partner dashboard, track earnings, and grow your network.</p>`;
    nextSteps = `
      <ul>
        <li>Refer students and earn commissions</li>
        <li>Track your referrals and earnings</li>
        <li>Access marketing materials</li>
        <li>Request payouts from your dashboard</li>
      </ul>`;
  } else {
    welcomeMessage = `<p>Congratulations! You have successfully registered on <strong>Samikaran Olympiad</strong>. Your student account is now active and ready to use.</p>`;
    extraInfo = studentId 
      ? `<div class="info-box">
          <p><strong>Your Student ID:</strong> ${studentId}</p>
          <p style="font-size: 13px; color: #6b7280;">Use this ID to log in along with your email or phone number.</p>
        </div>`
      : "";
    nextSteps = `
      <ul>
        <li>Explore available Olympiad exams</li>
        <li>Register for upcoming competitions</li>
        <li>Prepare with sample questions and study materials</li>
        <li>Track your performance and earn certificates</li>
      </ul>`;
  }

  const html = await brandedEmailWrapper("Welcome to Samikaran Olympiad", `
      <h2>Welcome, ${name}! 🎉</h2>
      ${welcomeMessage}
      ${extraInfo}
      <p>Here's what you can do next:</p>
      ${nextSteps}
      <a href="https://www.samikaranolympiad.com/dashboard" class="btn">Go to Dashboard</a>
      <hr class="divider">
      <p style="font-size: 13px; color: #6b7280;">Need help? Contact us at support@samikaranolympiad.com</p>
  `);

  return sendEmail({
    to: email,
    subject: `Welcome to Samikaran Olympiad, ${name}!`,
    html,
    text: `Welcome to Samikaran Olympiad, ${name}! You have successfully registered.${studentId ? ` Your Student ID is: ${studentId}.` : ''} Visit https://www.samikaranolympiad.com/dashboard to get started.`,
  });
}

export async function sendPaymentSuccessEmail(
  email: string,
  name: string,
  amount: string,
  currency: string,
  olympiadName: string,
  transactionId: string,
  invoiceNumber?: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("Payment Confirmation", `
      <h2>Payment Successful! ✅</h2>
      <p>Dear ${name},</p>
      <p>Your payment has been successfully processed. Here are the details:</p>
      <div class="info-box">
        <p><strong>Olympiad:</strong> ${olympiadName}</p>
        <p><strong>Amount Paid:</strong> ${currency} ${amount}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        ${invoiceNumber ? `<p><strong>Invoice No:</strong> ${invoiceNumber}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Confirmed</span></p>
      </div>
      <p>Your exam registration is now confirmed. You can view exam details and prepare from your student dashboard.</p>
      <a href="https://www.samikaranolympiad.com/dashboard" class="btn">View Dashboard</a>
      <hr class="divider">
      <p style="font-size: 13px; color: #6b7280;">For payment-related queries, email us at support@samikaranolympiad.com</p>
  `);

  return sendEmail({
    to: email,
    subject: `Payment Confirmed - ${olympiadName} | Samikaran Olympiad`,
    html,
    text: `Payment Confirmed! Dear ${name}, your payment of ${currency} ${amount} for ${olympiadName} has been successfully processed. Transaction ID: ${transactionId}. Visit your dashboard at https://www.samikaranolympiad.com/dashboard`,
  });
}

export async function sendExamRegistrationEmail(
  email: string,
  name: string,
  olympiadName: string,
  examDate?: string,
  className?: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("Exam Registration Confirmed", `
      <h2>Registration Confirmed! 📝</h2>
      <p>Dear ${name},</p>
      <p>You have been successfully registered for the following exam:</p>
      <div class="info-box">
        <p><strong>Olympiad:</strong> ${olympiadName}</p>
        ${className ? `<p><strong>Class:</strong> ${className}</p>` : ''}
        ${examDate ? `<p><strong>Exam Date:</strong> ${examDate}</p>` : '<p><strong>Exam Date:</strong> To be announced</p>'}
        <p><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Registered</span></p>
      </div>
      <p>Make sure to prepare well for the exam. Check sample questions and syllabus from your dashboard.</p>
      <a href="https://www.samikaranolympiad.com/dashboard" class="btn">Prepare Now</a>
      <hr class="divider">
      <p style="font-size: 13px; color: #6b7280;">Good luck with your preparation!</p>
  `);

  return sendEmail({
    to: email,
    subject: `Registration Confirmed - ${olympiadName} | Samikaran Olympiad`,
    html,
    text: `Registration Confirmed! Dear ${name}, you are registered for ${olympiadName}.${examDate ? ` Exam Date: ${examDate}.` : ''} Prepare from your dashboard at https://www.samikaranolympiad.com/dashboard`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const resetLink = `https://www.samikaranolympiad.com/reset-password?token=${resetToken}`;
  
  const html = await brandedEmailWrapper("Reset Your Password", `
      <h2>Password Reset Request</h2>
      <p>Dear ${name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <a href="${resetLink}" class="btn">Reset Password</a>
      <p class="warning">This link expires in 30 minutes. If you didn't request a password reset, please ignore this email.</p>
      <hr class="divider">
      <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link: ${resetLink}</p>
  `);

  return sendEmail({
    to: email,
    subject: `Reset Your Password | Samikaran Olympiad`,
    html,
    text: `Password Reset Request - Dear ${name}, click this link to reset your password: ${resetLink}. This link expires in 30 minutes.`,
  });
}

export async function sendExamReminderEmail(
  email: string,
  name: string,
  olympiadName: string,
  examDate: string,
  examTime?: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("Exam Reminder", `
      <h2>Exam Reminder 🔔</h2>
      <p>Dear ${name},</p>
      <p>This is a reminder that your exam is coming up soon!</p>
      <div class="info-box">
        <p><strong>Olympiad:</strong> ${olympiadName}</p>
        <p><strong>Date:</strong> ${examDate}</p>
        ${examTime ? `<p><strong>Time:</strong> ${examTime}</p>` : ''}
      </div>
      <p><strong>Before the exam, make sure you:</strong></p>
      <ul>
        <li>Have a stable internet connection</li>
        <li>Use a laptop/desktop with a working webcam</li>
        <li>Are in a quiet, well-lit room</li>
        <li>Have your Student ID ready</li>
      </ul>
      <a href="https://www.samikaranolympiad.com/dashboard" class="btn">Go to Dashboard</a>
  `);

  return sendEmail({
    to: email,
    subject: `Exam Reminder - ${olympiadName} | Samikaran Olympiad`,
    html,
    text: `Exam Reminder! Dear ${name}, your ${olympiadName} exam is on ${examDate}. Make sure you have a stable internet connection and webcam ready.`,
  });
}

export async function sendResultPublishedEmail(
  email: string,
  name: string,
  olympiadName: string,
  score?: string,
  rank?: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("Results Published", `
      <h2>Results Are Out! 🏆</h2>
      <p>Dear ${name},</p>
      <p>The results for <strong>${olympiadName}</strong> have been published!</p>
      ${score || rank ? `
      <div class="info-box">
        ${score ? `<p><strong>Your Score:</strong> ${score}</p>` : ''}
        ${rank ? `<p><strong>Your Rank:</strong> ${rank}</p>` : ''}
      </div>
      ` : ''}
      <p>Log in to your dashboard to view your detailed performance analysis, subject-wise breakdown, and download your certificate.</p>
      <a href="https://www.samikaranolympiad.com/dashboard" class="btn">View Results</a>
  `);

  return sendEmail({
    to: email,
    subject: `Results Published - ${olympiadName} | Samikaran Olympiad`,
    html,
    text: `Results Published! Dear ${name}, your results for ${olympiadName} are out.${score ? ` Score: ${score}.` : ''}${rank ? ` Rank: ${rank}.` : ''} View at https://www.samikaranolympiad.com/dashboard`,
  });
}

export async function sendCertificateReadyEmail(
  email: string,
  name: string,
  olympiadName: string,
  certificateType: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("Certificate Ready", `
      <h2>Your Certificate is Ready! 🎓</h2>
      <p>Dear ${name},</p>
      <p>Congratulations! Your <strong>${certificateType}</strong> certificate for <strong>${olympiadName}</strong> is ready for download.</p>
      <div class="info-box">
        <p><strong>Olympiad:</strong> ${olympiadName}</p>
        <p><strong>Certificate Type:</strong> ${certificateType}</p>
      </div>
      <p>You can download your certificate from your student dashboard.</p>
      <a href="https://www.samikaranolympiad.com/dashboard" class="btn">Download Certificate</a>
  `);

  return sendEmail({
    to: email,
    subject: `Certificate Ready - ${olympiadName} | Samikaran Olympiad`,
    html,
    text: `Your ${certificateType} certificate for ${olympiadName} is ready! Download it from your dashboard at https://www.samikaranolympiad.com/dashboard`,
  });
}

export async function sendSchoolWelcomeEmail(
  email: string,
  schoolName: string,
  contactPerson: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("School Partnership Welcome", `
      <h2>Welcome, ${schoolName}! 🏫</h2>
      <p>Dear ${contactPerson},</p>
      <p>Thank you for partnering with <strong>Samikaran Olympiad</strong>! Your school account has been created successfully.</p>
      <p>As a partner school, you can:</p>
      <ul>
        <li>Register students in bulk for olympiad exams</li>
        <li>Track student performance and analytics</li>
        <li>Access special pricing for group registrations</li>
        <li>Download school-level performance reports</li>
        <li>Manage supervisors and coordinators</li>
      </ul>
      <a href="https://www.samikaranolympiad.com" class="btn">Access School Dashboard</a>
      <hr class="divider">
      <p style="font-size: 13px; color: #6b7280;">For partnership queries, email partnerships@samikaranolympiad.com</p>
  `);

  return sendEmail({
    to: email,
    subject: `Welcome to Samikaran Olympiad, ${schoolName}!`,
    html,
    text: `Welcome to Samikaran Olympiad, ${schoolName}! Your school partnership account is ready. Access your dashboard at https://www.samikaranolympiad.com`,
  });
}

export async function sendPartnerWelcomeEmail(
  email: string,
  name: string,
  partnerCode: string
): Promise<boolean> {
  const html = await brandedEmailWrapper("Partner Welcome", `
      <h2>Welcome, Partner ${name}! 🤝</h2>
      <p>Your partner account on <strong>Samikaran Olympiad</strong> has been activated.</p>
      <div class="info-box">
        <p><strong>Your Partner/Referral Code:</strong> <span style="font-size: 18px; font-weight: 700; color: #8A2BE2;">${partnerCode}</span></p>
        <p style="font-size: 13px;">Share this code with students to earn referral rewards!</p>
      </div>
      <p>As a partner, you can:</p>
      <ul>
        <li>Refer students and earn commissions</li>
        <li>Track your referrals and earnings</li>
        <li>Access marketing materials</li>
        <li>Request payouts from your dashboard</li>
      </ul>
      <a href="https://www.samikaranolympiad.com" class="btn">Access Partner Dashboard</a>
  `);

  return sendEmail({
    to: email,
    subject: `Partner Account Activated | Samikaran Olympiad`,
    html,
    text: `Welcome Partner ${name}! Your partner code is: ${partnerCode}. Share it with students to earn rewards. Dashboard: https://www.samikaranolympiad.com`,
  });
}

export async function sendEnquiryAutoReply(enquiryId: number, name: string, email: string): Promise<boolean> {
  const html = await brandedEmailWrapper("Enquiry Received", `
      <h2>Thank You, ${name}!</h2>
      <p>We have received your enquiry and our team will get back to you within 24-48 hours.</p>
      <p>We're excited to share that Samikaran Olympiad offers:</p>
      <ul>
        <li>AI-Powered Adaptive Testing</li>
        <li>Secure Online Proctoring</li>
        <li>Global Rankings & Certificates</li>
        <li>Comprehensive Analytics</li>
      </ul>
      <p>Stay tuned for our latest updates!</p>
      <a href="https://www.samikaranolympiad.com" class="btn">Visit Our Website</a>
  `);

  const success = await sendEmail({
    to: email,
    subject: "Thank you for your enquiry - Samikaran Olympiad",
    html,
    text: `Thank You, ${name}! We have received your enquiry and our team will get back to you within 24-48 hours. Visit https://www.samikaranolympiad.com`,
  });

  if (success) {
    await storage.markEnquiryEmailSent(enquiryId);
  }

  return success;
}

export async function sendCmsFormAutoReply(
  submissionId: number,
  formType: string,
  name: string,
  email: string
): Promise<boolean> {
  let subject = "";
  let messageTitle = "";
  let messageBody = "";

  switch (formType) {
    case 'contact':
      subject = "Thank you for contacting us - Samikaran Olympiad";
      messageTitle = "We've Received Your Message";
      messageBody = "Our team will review your inquiry and respond within 24-48 hours. We appreciate your patience.";
      break;
    case 'partner':
      subject = "Partnership Request Received - Samikaran Olympiad";
      messageTitle = "Partnership Application Received";
      messageBody = "Thank you for your interest in partnering with Samikaran Olympiad. Our partnership team will review your application and reach out within 3-5 business days.";
      break;
    case 'notify':
      subject = "You're on the list! - Samikaran Olympiad";
      messageTitle = "Welcome to Our Launch List";
      messageBody = "You'll be among the first to know when Samikaran Olympiad officially launches. Get ready for a revolutionary olympiad experience!";
      break;
    default:
      subject = "Thank you for your submission - Samikaran Olympiad";
      messageTitle = "Submission Received";
      messageBody = "We have received your submission and will get back to you shortly.";
  }

  const html = await brandedEmailWrapper(messageTitle, `
      <h2>Hello, ${name}!</h2>
      <h3>${messageTitle}</h3>
      <p>${messageBody}</p>
      <a href="https://www.samikaranolympiad.com" class="btn">Visit Our Website</a>
  `);

  const success = await sendEmail({
    to: email,
    subject,
    html,
    text: `Hello, ${name}! ${messageTitle} - ${messageBody}. Visit https://www.samikaranolympiad.com`,
  });

  if (success) {
    await storage.markCmsFormAutoReplySent(submissionId);
  }

  return success;
}
