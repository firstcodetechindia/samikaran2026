import { db } from "../db";
import { smsTemplates } from "@workspace/db";

const templates = [
  {
    name: "OTP Verification",
    body: "Your Samikaran Olympiad OTP is {{otp}}. Valid for {{validity_minutes}} min. Do not share with anyone.",
    variables: "otp,validity_minutes",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Login OTP",
    body: "Your login OTP for Samikaran Olympiad is {{otp}}. Valid for {{validity_minutes}} min. If not requested by you, ignore this message.",
    variables: "otp,validity_minutes",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Registration Welcome",
    body: "Welcome to Samikaran Olympiad, {{name}}! Your Student ID is {{student_id}}. Login at samikaranolympiad.com to start your journey.",
    variables: "name,student_id",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Payment Confirmation",
    body: "Payment of Rs.{{amount}} received for {{olympiad_name}}. Txn ID: {{transaction_id}}. Thank you, {{name}}! - Samikaran Olympiad",
    variables: "name,amount,olympiad_name,transaction_id",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Exam Reminder",
    body: "Reminder: {{olympiad_name}} exam on {{exam_date}} at {{exam_time}}. Duration: {{duration}} min. Ensure stable internet & webcam. - Samikaran Olympiad",
    variables: "olympiad_name,exam_date,exam_time,duration",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Result Published",
    body: "Results out! {{name}}, you scored {{score}}/{{total_marks}} (Rank #{{rank}}) in {{olympiad_name}}. View details at samikaranolympiad.com - Samikaran Olympiad",
    variables: "name,olympiad_name,score,total_marks,rank",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Password Reset",
    body: "Your password reset OTP for Samikaran Olympiad is {{otp}}. Valid for {{validity_minutes}} min. If not requested, ignore this.",
    variables: "otp,validity_minutes",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
  {
    name: "Forgot Password OTP",
    body: "Hi {{name}}, use OTP {{otp}} to reset your Samikaran Olympiad password. Valid for {{validity_minutes}} min. Do not share.",
    variables: "name,otp,validity_minutes",
    channel: "sms",
    msg91SmsTemplateId: "",
    msg91WhatsappTemplateName: "",
    isActive: true,
  },
];

export async function seedSmsTemplates() {
  for (const tpl of templates) {
    await db
      .insert(smsTemplates)
      .values(tpl)
      .onConflictDoNothing({ target: smsTemplates.name });
  }
}
