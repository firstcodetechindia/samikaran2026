import { db } from "../db";
import { emailTemplates, emailTemplateAssignments } from "@shared/schema";
import { eq } from "drizzle-orm";

const brandHeader = `
<div style="background: linear-gradient(135deg, #8A2BE2, #FF2FBF); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">SAMIKARAN.</h1>
  <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0 0; font-size: 13px; letter-spacing: 3px; text-transform: uppercase;">Olympiad</p>
</div>`;

const brandFooter = `
<div style="background: #1a1a2e; color: #9ca3af; padding: 24px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px;">
  <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Samikaran Edutech LLP. All rights reserved.</p>
  <p style="margin: 0 0 8px 0;">
    <a href="https://samikaranolympiad.com/privacy-policy" style="color: #a78bfa; text-decoration: none;">Privacy Policy</a> &middot;
    <a href="https://samikaranolympiad.com/terms-and-conditions" style="color: #a78bfa; text-decoration: none;">Terms</a> &middot;
    <a href="https://samikaranolympiad.com/contact" style="color: #a78bfa; text-decoration: none;">Contact Us</a>
  </p>
  <p style="margin: 0; color: #6b7280; font-size: 11px;">This is an automated message from Samikaran Olympiad. Please do not reply directly.</p>
</div>`;

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
${brandHeader}
<div style="padding: 32px 28px; color: #374151; line-height: 1.7;">
${content}
</div>
${brandFooter}
</div>
</body>
</html>`;
}

const btn = (text: string, url: string = "#") =>
  `<a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #8A2BE2, #FF2FBF); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 16px 0;">${text}</a>`;

const templates = [
  {
    name: "OTP Verification",
    slug: "otp-verification",
    category: "system",
    type: "transactional",
    subject: "Your OTP Code - Samikaran Olympiad",
    previewText: "Your one-time password for Samikaran Olympiad",
    variables: ["name", "otp", "validity_minutes"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Verify Your Identity</h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>Your one-time password (OTP) for Samikaran Olympiad is:</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #f3e8ff, #fce7f3); border: 2px dashed #8B5CF6; border-radius: 12px; padding: 20px 40px;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #7C3AED;">{{otp}}</span>
        </div>
      </div>
      <p style="color: #6b7280; font-size: 13px;">This OTP is valid for <strong>{{validity_minutes}} minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #ef4444; font-size: 13px;"> If you did not request this, please ignore this email.</p>
    `),
  },
  {
    name: "Forgot Password",
    slug: "forgot-password",
    category: "system",
    type: "transactional",
    subject: "Reset Your Password - Samikaran Olympiad",
    previewText: "Reset your Samikaran Olympiad account password",
    variables: ["name", "reset_link", "validity_hours"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Password Reset Request</h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>We received a request to reset the password for your Samikaran Olympiad account.</p>
      <div style="text-align: center;">${btn("Reset My Password", "{{reset_link}}")}</div>
      <p style="color: #6b7280; font-size: 13px;">This link is valid for <strong>{{validity_hours}} hours</strong>. If you didn't request this, you can safely ignore this email.</p>
      <p style="color: #6b7280; font-size: 13px;">Or copy this link: <a href="{{reset_link}}" style="color: #7C3AED; word-break: break-all;">{{reset_link}}</a></p>
    `),
  },
  {
    name: "Welcome - Registration Success",
    slug: "welcome-registration",
    category: "system",
    type: "transactional",
    subject: "Welcome to Samikaran Olympiad! ",
    previewText: "Your account has been created successfully",
    variables: ["name", "student_id", "email", "login_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Welcome Aboard! </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>Congratulations! Your Samikaran Olympiad account has been successfully created.</p>
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Student ID</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{student_id}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Email</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{email}}</td></tr>
        </table>
      </div>
      <p>You can now explore olympiad subjects, register for exams, and compete with students across India!</p>
      <div style="text-align: center;">${btn("Go to Dashboard", "{{login_link}}")}</div>
    `),
  },
  {
    name: "Payment Success",
    slug: "payment-success",
    category: "system",
    type: "transactional",
    subject: "Payment Confirmed - Samikaran Olympiad",
    previewText: "Your payment has been successfully processed",
    variables: ["name", "amount", "transaction_id", "olympiad_name", "payment_date", "receipt_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Payment Confirmed </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>Your payment has been successfully processed. Here are the details:</p>
      <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Amount Paid</td><td style="padding: 8px 0; font-weight: 900; color: #059669; font-size: 18px;">₹{{amount}}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Transaction ID</td><td style="padding: 8px 0; font-weight: 700; color: #1f2937; font-family: monospace;">{{transaction_id}}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Olympiad</td><td style="padding: 8px 0; font-weight: 700; color: #1f2937;">{{olympiad_name}}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 8px 0; font-weight: 700; color: #1f2937;">{{payment_date}}</td></tr>
        </table>
      </div>
      <div style="text-align: center;">${btn("Download Receipt", "{{receipt_link}}")}</div>
    `),
  },
  {
    name: "Olympiad Registration",
    slug: "olympiad-registration",
    category: "system",
    type: "transactional",
    subject: "Registration Confirmed: {{olympiad_name}}",
    previewText: "You are registered for the olympiad",
    variables: ["name", "olympiad_name", "exam_date", "duration", "class", "subject", "dashboard_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Registration Confirmed </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>You have been successfully registered for the following olympiad:</p>
      <div style="background: linear-gradient(135deg, #ede9fe, #fce7f3); border-radius: 10px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #7C3AED; margin: 0 0 12px 0;">{{olympiad_name}}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;"> Subject</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{subject}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;"> Class</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{class}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;"> Exam Date</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{exam_date}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;"> Duration</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{duration}} minutes</td></tr>
        </table>
      </div>
      <p><strong>Important:</strong> Make sure you have a stable internet connection and a working webcam for proctored exams.</p>
      <div style="text-align: center;">${btn("View My Registrations", "{{dashboard_link}}")}</div>
    `),
  },
  {
    name: "Exam Reminder",
    slug: "exam-reminder",
    category: "system",
    type: "transactional",
    subject: "Reminder: {{olympiad_name}} starts soon!",
    previewText: "Your exam is coming up",
    variables: ["name", "olympiad_name", "exam_date", "exam_time", "duration", "exam_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Exam Reminder </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>This is a friendly reminder that your olympiad exam is coming up!</p>
      <div style="background: #fffbeb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #fde68a;">
        <h3 style="color: #d97706; margin: 0 0 12px 0;">{{olympiad_name}}</h3>
        <p style="margin: 4px 0; font-size: 14px;"> <strong>Date:</strong> {{exam_date}}</p>
        <p style="margin: 4px 0; font-size: 14px;"> <strong>Time:</strong> {{exam_time}}</p>
        <p style="margin: 4px 0; font-size: 14px;"> <strong>Duration:</strong> {{duration}} minutes</p>
      </div>
      <h3 style="color: #1f2937; font-size: 16px;">Before the exam:</h3>
      <ul style="color: #4b5563; font-size: 14px;">
        <li>Ensure stable internet connection</li>
        <li>Keep your webcam ready (for proctored exams)</li>
        <li>Find a quiet, well-lit space</li>
        <li>Keep your Student ID handy</li>
      </ul>
      <div style="text-align: center;">${btn("Start Exam", "{{exam_link}}")}</div>
    `),
  },
  {
    name: "Result Published",
    slug: "result-published",
    category: "system",
    type: "transactional",
    subject: "Results Out: {{olympiad_name}}",
    previewText: "Your olympiad results are now available",
    variables: ["name", "olympiad_name", "rank", "score", "total_marks", "percentage", "medal", "result_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Results Published </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>The results for <strong>{{olympiad_name}}</strong> have been published!</p>
      <div style="background: linear-gradient(135deg, #fef3c7, #fce7f3); border-radius: 10px; padding: 24px; margin: 20px 0; text-align: center;">
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Your Rank</p>
        <p style="font-size: 42px; font-weight: 900; color: #7C3AED; margin: 0;">#{{rank}}</p>
        <p style="font-size: 16px; color: #374151; margin: 8px 0 0 0;"><strong>{{score}}/{{total_marks}}</strong> ({{percentage}}%)</p>
        <p style="font-size: 14px; margin: 8px 0 0 0;"> <strong>{{medal}} Medal</strong></p>
      </div>
      <div style="text-align: center;">${btn("View Detailed Report", "{{result_link}}")}</div>
    `),
  },
  {
    name: "Certificate Ready",
    slug: "certificate-ready",
    category: "system",
    type: "transactional",
    subject: "Your Certificate is Ready! - {{olympiad_name}}",
    previewText: "Download your olympiad certificate",
    variables: ["name", "olympiad_name", "medal", "certificate_id", "download_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Certificate Ready </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>Your <strong>{{medal}}</strong> certificate for <strong>{{olympiad_name}}</strong> is ready for download!</p>
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; text-align: center;">
        <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0;">Certificate ID</p>
        <p style="font-size: 16px; font-weight: 700; color: #1f2937; font-family: monospace; margin: 0;">{{certificate_id}}</p>
      </div>
      <p>This certificate includes a unique QR code for verification and is digitally signed by Samikaran Olympiad.</p>
      <div style="text-align: center;">${btn("Download Certificate", "{{download_link}}")}</div>
    `),
  },
  {
    name: "School Welcome",
    slug: "school-welcome",
    category: "partner",
    type: "transactional",
    subject: "Welcome to Samikaran Olympiad Partner Program!",
    previewText: "Your school is now registered as a partner",
    variables: ["school_name", "coordinator_name", "school_code", "dashboard_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Welcome, Partner School! </h2>
      <p>Dear <strong>{{coordinator_name}}</strong>,</p>
      <p>We're thrilled to welcome <strong>{{school_name}}</strong> to the Samikaran Olympiad family!</p>
      <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>School Code:</strong> {{school_code}}</p>
      </div>
      <h3 style="color: #1f2937; font-size: 16px;">What you can do:</h3>
      <ul style="color: #4b5563; font-size: 14px;">
        <li>Register students in bulk</li>
        <li>Track student performance</li>
        <li>Access school-level analytics</li>
        <li>Download certificates for your students</li>
      </ul>
      <div style="text-align: center;">${btn("Access School Dashboard", "{{dashboard_link}}")}</div>
    `),
  },
  {
    name: "Partner Welcome",
    slug: "partner-welcome",
    category: "partner",
    type: "transactional",
    subject: "Welcome, Partner! - Samikaran Olympiad",
    previewText: "Your partner account is now active",
    variables: ["partner_name", "partner_code", "commission_rate", "dashboard_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Welcome to Our Partner Network! </h2>
      <p>Dear <strong>{{partner_name}}</strong>,</p>
      <p>Your partner account with Samikaran Olympiad is now active!</p>
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Partner Code</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{partner_code}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Commission Rate</td><td style="padding: 6px 0; font-weight: 700; color: #059669;">{{commission_rate}}%</td></tr>
        </table>
      </div>
      <div style="text-align: center;">${btn("Go to Partner Dashboard", "{{dashboard_link}}")}</div>
    `),
  },
  {
    name: "Group/Coordinator Welcome",
    slug: "group-welcome",
    category: "partner",
    type: "transactional",
    subject: "Welcome, Coordinator! - Samikaran Olympiad",
    previewText: "Your group coordinator account is active",
    variables: ["coordinator_name", "group_name", "group_code", "dashboard_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Welcome, Coordinator! </h2>
      <p>Dear <strong>{{coordinator_name}}</strong>,</p>
      <p>Your group <strong>{{group_name}}</strong> has been registered with Samikaran Olympiad.</p>
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Group Code:</strong> {{group_code}}</p>
      </div>
      <p>You can now manage students, track performance, and coordinate olympiad registrations for your group.</p>
      <div style="text-align: center;">${btn("Access Group Dashboard", "{{dashboard_link}}")}</div>
    `),
  },
  {
    name: "Supervisor Welcome",
    slug: "supervisor-welcome",
    category: "partner",
    type: "transactional",
    subject: "Welcome, Supervisor! - Samikaran Olympiad",
    previewText: "Your supervisor account is active",
    variables: ["supervisor_name", "supervisor_id", "dashboard_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Welcome, Supervisor! 👨‍</h2>
      <p>Dear <strong>{{supervisor_name}}</strong>,</p>
      <p>Your supervisor account with Samikaran Olympiad is now active. You can manage and monitor your students' olympiad journey.</p>
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Supervisor ID:</strong> {{supervisor_id}}</p>
      </div>
      <div style="text-align: center;">${btn("Access Dashboard", "{{dashboard_link}}")}</div>
    `),
  },
  {
    name: "Promotional Offer",
    slug: "promotional-offer",
    category: "marketing",
    type: "marketing",
    subject: "{{offer_title}} - Samikaran Olympiad",
    previewText: "Special offer for Samikaran Olympiad students",
    variables: ["name", "offer_title", "offer_description", "discount_percent", "coupon_code", "expiry_date", "cta_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;"> Special Offer!</h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>{{offer_description}}</p>
      <div style="background: linear-gradient(135deg, #ede9fe, #fce7f3); border-radius: 10px; padding: 24px; margin: 20px 0; text-align: center;">
        <p style="font-size: 48px; font-weight: 900; color: #7C3AED; margin: 0;">{{discount_percent}}% OFF</p>
        <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">Use code:</p>
        <div style="display: inline-block; background: white; border: 2px dashed #8B5CF6; border-radius: 8px; padding: 10px 28px;">
          <span style="font-size: 20px; font-weight: 900; letter-spacing: 4px; color: #7C3AED;">{{coupon_code}}</span>
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin: 12px 0 0 0;">Valid until: {{expiry_date}}</p>
      </div>
      <div style="text-align: center;">${btn("Claim Offer", "{{cta_link}}")}</div>
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">If you no longer wish to receive promotional emails, you can unsubscribe anytime.</p>
    `),
  },
  {
    name: "Referral Invitation",
    slug: "referral-invitation",
    category: "marketing",
    type: "marketing",
    subject: "{{referrer_name}} invited you to Samikaran Olympiad!",
    previewText: "You've been invited to join Samikaran Olympiad",
    variables: ["referrer_name", "referee_name", "referral_code", "discount_amount", "register_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">You're Invited! </h2>
      <p>Hello <strong>{{referee_name}}</strong>,</p>
      <p><strong>{{referrer_name}}</strong> thinks you'd love competing in Samikaran Olympiad — India's premier AI-powered olympiad platform!</p>
      <p>Use the referral code below to get <strong>{{discount_amount}}</strong> off your first registration:</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="display: inline-block; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; padding: 12px 32px;">
          <span style="font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #16a34a;">{{referral_code}}</span>
        </div>
      </div>
      <div style="text-align: center;">${btn("Register Now", "{{register_link}}")}</div>
    `),
  },
  {
    name: "Newsletter",
    slug: "newsletter",
    category: "marketing",
    type: "marketing",
    subject: "{{newsletter_title}} - Samikaran Olympiad",
    previewText: "Latest updates from Samikaran Olympiad",
    variables: ["name", "newsletter_title", "content_html", "website_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">{{newsletter_title}}</h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      {{content_html}}
      <div style="text-align: center; margin-top: 24px;">${btn("Visit Website", "{{website_link}}")}</div>
      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px;">If you no longer wish to receive these emails, you can unsubscribe anytime.</p>
    `),
  },
  {
    name: "Event Announcement",
    slug: "event-announcement",
    category: "events",
    type: "marketing",
    subject: "{{event_name}} - Samikaran Olympiad",
    previewText: "New event announcement from Samikaran Olympiad",
    variables: ["name", "event_name", "event_description", "event_date", "event_time", "cta_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;"> {{event_name}}</h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>{{event_description}}</p>
      <div style="background: #eff6ff; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #bfdbfe;">
        <p style="margin: 4px 0; font-size: 14px;"> <strong>Date:</strong> {{event_date}}</p>
        <p style="margin: 4px 0; font-size: 14px;"> <strong>Time:</strong> {{event_time}}</p>
      </div>
      <div style="text-align: center;">${btn("Learn More", "{{cta_link}}")}</div>
    `),
  },
  {
    name: "School Performance Report",
    slug: "school-performance-report",
    category: "partner",
    type: "transactional",
    subject: "Monthly Performance Report - {{school_name}}",
    previewText: "Your school's olympiad performance summary",
    variables: ["coordinator_name", "school_name", "month", "total_students", "avg_score", "top_performer", "report_link"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Performance Report </h2>
      <p>Dear <strong>{{coordinator_name}}</strong>,</p>
      <p>Here is the monthly performance summary for <strong>{{school_name}}</strong> — {{month}}:</p>
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Total Students Participated</td><td style="padding: 8px 0; font-weight: 700; color: #1f2937;">{{total_students}}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Average Score</td><td style="padding: 8px 0; font-weight: 700; color: #7C3AED;">{{avg_score}}%</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Top Performer</td><td style="padding: 8px 0; font-weight: 700; color: #059669;">{{top_performer}}</td></tr>
        </table>
      </div>
      <div style="text-align: center;">${btn("View Full Report", "{{report_link}}")}</div>
    `),
  },
  {
    name: "Refund Processed",
    slug: "refund-processed",
    category: "system",
    type: "transactional",
    subject: "Refund Processed - Samikaran Olympiad",
    previewText: "Your refund has been processed",
    variables: ["name", "amount", "refund_id", "original_transaction_id", "refund_date"],
    isDefault: true,
    htmlContent: wrap(`
      <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Refund Processed </h2>
      <p>Hello <strong>{{name}}</strong>,</p>
      <p>Your refund has been successfully processed. The amount will be credited to your original payment method within 5-7 business days.</p>
      <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Refund Amount</td><td style="padding: 6px 0; font-weight: 900; color: #059669; font-size: 18px;">₹{{amount}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Refund ID</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937; font-family: monospace;">{{refund_id}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Original Transaction</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937; font-family: monospace;">{{original_transaction_id}}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 6px 0; font-weight: 700; color: #1f2937;">{{refund_date}}</td></tr>
        </table>
      </div>
    `),
  },
];

const eventTypes = [
  { eventType: "otp_verification", templateSlug: "otp-verification", label: "OTP Verification" },
  { eventType: "forgot_password", templateSlug: "forgot-password", label: "Forgot Password" },
  { eventType: "registration_success", templateSlug: "welcome-registration", label: "Registration Success" },
  { eventType: "payment_success", templateSlug: "payment-success", label: "Payment Success" },
  { eventType: "olympiad_registration", templateSlug: "olympiad-registration", label: "Olympiad Registration" },
  { eventType: "exam_reminder", templateSlug: "exam-reminder", label: "Exam Reminder" },
  { eventType: "result_published", templateSlug: "result-published", label: "Result Published" },
  { eventType: "certificate_ready", templateSlug: "certificate-ready", label: "Certificate Ready" },
  { eventType: "school_welcome", templateSlug: "school-welcome", label: "School Welcome" },
  { eventType: "partner_welcome", templateSlug: "partner-welcome", label: "Partner Welcome" },
  { eventType: "group_welcome", templateSlug: "group-welcome", label: "Group Welcome" },
  { eventType: "supervisor_welcome", templateSlug: "supervisor-welcome", label: "Supervisor Welcome" },
  { eventType: "promotional_offer", templateSlug: "promotional-offer", label: "Promotional Offer" },
  { eventType: "referral_invitation", templateSlug: "referral-invitation", label: "Referral Invitation" },
  { eventType: "newsletter", templateSlug: "newsletter", label: "Newsletter" },
  { eventType: "event_announcement", templateSlug: "event-announcement", label: "Event Announcement" },
  { eventType: "school_report", templateSlug: "school-performance-report", label: "School Performance Report" },
  { eventType: "refund_processed", templateSlug: "refund-processed", label: "Refund Processed" },
];

export { eventTypes };

export async function seedEmailTemplates() {
  console.log("Starting email template seeding...");

  const existing = await db.select({ id: emailTemplates.id }).from(emailTemplates).limit(1);
  if (existing.length > 0) {
    console.log("Email templates already exist. Skipping seed.");
    return;
  }

  for (const t of templates) {
    await db.insert(emailTemplates).values({
      name: t.name,
      slug: t.slug,
      category: t.category,
      type: t.type,
      subject: t.subject,
      previewText: t.previewText || null,
      htmlContent: t.htmlContent,
      plainTextContent: null,
      jsonContent: null,
      variables: t.variables,
      headerHtml: null,
      footerHtml: null,
      isActive: true,
      isDefault: t.isDefault,
      version: 1,
    });
  }

  console.log(`Seeded ${templates.length} email templates successfully.`);

  console.log("Seeding email template assignments...");
  for (const evt of eventTypes) {
    const [template] = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.slug, evt.templateSlug));
    if (template) {
      await db.insert(emailTemplateAssignments).values({
        eventType: evt.eventType,
        label: evt.label,
        templateId: template.id,
        isActive: true,
      }).onConflictDoNothing();
    }
  }
  console.log(`Seeded ${eventTypes.length} email template assignments.`);
}
