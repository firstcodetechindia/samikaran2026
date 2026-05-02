import { storage } from "./storage";

interface MSG91Config {
  authKey: string;
  senderId: string;
  whatsappNumber: string;
  defaultChannel: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel?: string;
}

let lastError = "";

export function getLastSmsError(): string {
  return lastError;
}

export async function getMSG91Config(): Promise<MSG91Config> {
  const settings = await storage.getSettingsByCategory("sms");
  const get = (key: string) => settings.find(s => s.key === key)?.value || "";

  return {
    authKey: get("msg91_auth_key"),
    senderId: get("msg91_sender_id") || "SAMIKR",
    whatsappNumber: get("msg91_whatsapp_number"),
    defaultChannel: get("msg91_default_channel") || "sms",
  };
}

export function renderSmsTemplate(body: string, variables: Record<string, string>): string {
  let rendered = body;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return rendered;
}

async function sendViaMSG91SMS(to: string, templateId: string, variables: Record<string, string>, config: MSG91Config): Promise<SendResult> {
  if (!config.authKey) {
    return { success: false, error: "MSG91 Auth Key not configured. Go to Global Settings > SMS.", channel: "sms" };
  }
  if (!templateId) {
    return { success: false, error: "MSG91 SMS Template ID not set for this template.", channel: "sms" };
  }

  const cleanPhone = to.replace(/^\+/, "");
  const recipients: Record<string, string> = { mobiles: cleanPhone };
  Object.entries(variables).forEach(([key, value]) => {
    recipients[key] = value;
  });

  const payload = {
    template_id: templateId,
    short_url: "0",
    recipients: [recipients],
  };

  try {
    console.log(`[MSG91-SMS] Sending to: ${to} | template: ${templateId}`);
    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "authkey": config.authKey,
        "content-type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (response.ok) {
      let messageId: string | undefined;
      try {
        const data = JSON.parse(responseText);
        messageId = data.request_id || data.message;
      } catch {}
      console.log(`[MSG91-SMS] Success: ${responseText}`);
      return { success: true, messageId, channel: "sms" };
    } else {
      const error = `MSG91 SMS API ${response.status}: ${responseText}`;
      console.error(`[MSG91-SMS] ${error}`);
      return { success: false, error, channel: "sms" };
    }
  } catch (error: any) {
    const msg = `MSG91 SMS exception: ${error.message || String(error)}`;
    console.error(`[MSG91-SMS] ${msg}`);
    return { success: false, error: msg, channel: "sms" };
  }
}

async function sendViaMSG91WhatsApp(to: string, templateName: string, variables: Record<string, string>, config: MSG91Config): Promise<SendResult> {
  if (!config.authKey) {
    return { success: false, error: "MSG91 Auth Key not configured.", channel: "whatsapp" };
  }
  if (!config.whatsappNumber) {
    return { success: false, error: "MSG91 WhatsApp Integrated Number not configured.", channel: "whatsapp" };
  }
  if (!templateName) {
    return { success: false, error: "MSG91 WhatsApp Template Name not set for this template.", channel: "whatsapp" };
  }

  const cleanPhone = to.replace(/^\+/, "");
  const components: Record<string, { type: string; value: string }> = {};
  const varKeys = Object.keys(variables);
  for (let i = 0; i < varKeys.length; i++) {
    components[`body_${i + 1}`] = { type: "text", value: variables[varKeys[i]] };
  }

  const payload = {
    integrated_number: config.whatsappNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        to_and_components: [
          {
            to: cleanPhone,
            components,
          },
        ],
      },
    },
  };

  try {
    console.log(`[MSG91-WA] Sending to: ${to} | template: ${templateName}`);
    const response = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
      method: "POST",
      headers: {
        "authkey": config.authKey,
        "content-type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (response.ok) {
      let messageId: string | undefined;
      try {
        const data = JSON.parse(responseText);
        messageId = data.request_id || data.data?.id;
      } catch {}
      console.log(`[MSG91-WA] Success: ${responseText}`);
      return { success: true, messageId, channel: "whatsapp" };
    } else {
      const error = `MSG91 WhatsApp API ${response.status}: ${responseText}`;
      console.error(`[MSG91-WA] ${error}`);
      return { success: false, error, channel: "whatsapp" };
    }
  } catch (error: any) {
    const msg = `MSG91 WhatsApp exception: ${error.message || String(error)}`;
    console.error(`[MSG91-WA] ${msg}`);
    return { success: false, error: msg, channel: "whatsapp" };
  }
}

export async function sendTemplatedMessage(phone: string, templateName: string, variables: Record<string, string>): Promise<SendResult> {
  lastError = "";

  try {
    const templates = await storage.getAllSmsTemplates();
    const template = templates.find(t => t.name === templateName);

    if (!template) {
      lastError = `Template not found: ${templateName}`;
      console.error(`[MSG91] ${lastError}`);
      return { success: false, error: lastError };
    }

    if (!template.isActive) {
      lastError = `Template is inactive: ${templateName}`;
      console.error(`[MSG91] ${lastError}`);
      return { success: false, error: lastError };
    }

    const config = await getMSG91Config();
    const channel = (template as any).channel || config.defaultChannel || "sms";

    console.log(`[MSG91] Sending "${templateName}" via ${channel} to: ${phone}`);

    if (channel === "both") {
      const smsTemplateId = (template as any).msg91SmsTemplateId || "";
      const waTemplateName = (template as any).msg91WhatsappTemplateName || "";
      const results: SendResult[] = [];

      if (waTemplateName) {
        results.push(await sendViaMSG91WhatsApp(phone, waTemplateName, variables, config));
      }
      if (smsTemplateId) {
        results.push(await sendViaMSG91SMS(phone, smsTemplateId, variables, config));
      }

      const anySuccess = results.some(r => r.success);
      if (anySuccess) {
        return { success: true, channel: "both", messageId: results.find(r => r.success)?.messageId };
      }
      lastError = results.map(r => r.error).filter(Boolean).join("; ");
      return { success: false, error: lastError, channel: "both" };

    } else if (channel === "whatsapp") {
      const waTemplateName = (template as any).msg91WhatsappTemplateName || "";
      if (!waTemplateName) {
        lastError = `No WhatsApp template name set for "${templateName}". Set it in Global Settings > SMS.`;
        return { success: false, error: lastError, channel: "whatsapp" };
      }
      const result = await sendViaMSG91WhatsApp(phone, waTemplateName, variables, config);
      if (!result.success && result.error) lastError = result.error;
      return result;

    } else {
      const smsTemplateId = (template as any).msg91SmsTemplateId || "";
      if (!smsTemplateId) {
        lastError = `No SMS template ID set for "${templateName}". Set it in Global Settings > SMS.`;
        return { success: false, error: lastError, channel: "sms" };
      }
      const result = await sendViaMSG91SMS(phone, smsTemplateId, variables, config);
      if (!result.success && result.error) lastError = result.error;
      return result;
    }
  } catch (error: any) {
    lastError = `sendTemplatedMessage error: ${error.message || String(error)}`;
    console.error(`[MSG91] ${lastError}`);
    return { success: false, error: lastError };
  }
}

export async function sendOtpSms(phone: string, otpCode: string, purpose: string = "verification"): Promise<SendResult> {
  const templateMap: Record<string, string> = {
    login: "Login OTP",
    registration: "OTP Verification",
    forgot_password: "Forgot Password OTP",
    admin_login: "OTP Verification",
    verification: "OTP Verification",
  };

  const templateName = templateMap[purpose] || "OTP Verification";
  const variables = { otp: otpCode, name: "User", validity_minutes: "5" };

  console.log(`[MSG91] Sending OTP to: ${phone} | purpose: ${purpose} | template: ${templateName}`);
  return sendTemplatedMessage(phone, templateName, variables);
}

export async function sendTemplatedSms(phone: string, templateName: string, variables: Record<string, string>): Promise<SendResult> {
  return sendTemplatedMessage(phone, templateName, variables);
}

export async function sendSms(to: string, content: string, senderId?: string): Promise<SendResult> {
  lastError = "";
  return { success: false, error: "Direct content send requires a template. Use sendTemplatedMessage instead." };
}
