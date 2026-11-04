// Server-only helpers for sending email through Resend (https://resend.com).
// Configure via environment variables (never commit the key):
//   RESEND_API_KEY      – your Resend API key
//   RESEND_FROM_EMAIL   – e.g. "United Bank Offshore <no-reply@yourdomain.com>" (domain must be verified in Resend)
//   SUPPORT_EMAIL       – inbox that receives customer-service chat messages
//   APP_URL             – optional, e.g. https://your-app.vercel.app (used for links in emails)

const RESEND_URL = "https://api.resend.com/emails";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env["RESEND_FROM_EMAIL"] ?? "United Bank Offshore <onboarding@resend.dev>";

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[Resend] ${res.status} ${detail}`);
    throw new Error("Email could not be sent");
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f8fafc;color:#0b1d3a;font-family:Arial,sans-serif;padding:32px 16px">
<main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
<p style="font-size:12px;font-weight:700;letter-spacing:3px;color:#c5a059;text-transform:uppercase;margin:0">United Bank Offshore</p>
<h1 style="font-size:26px;margin:18px 0 8px">${title}</h1>
${body}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
<p style="font-size:12px;color:#718096;line-height:1.5;margin:0">United Bank Offshore — Global banking. Borderless opportunities.<br>We will never ask for your password or one-time codes by email.</p>
</main></body></html>`;
}

export function welcomeEmail(name: string, appUrl: string | null) {
  const safeName = escapeHtml(name || "valued client");
  const button = appUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(appUrl)}/dashboard" style="display:inline-block;background:#0b1d3a;color:#ffffff;text-decoration:none;border-radius:8px;padding:13px 20px;font-weight:700">Open your banking console</a></p>`
    : "";
  return {
    subject: "Welcome to United Bank Offshore",
    html: layout(
      `Welcome, ${safeName}`,
      `<p style="color:#536174;line-height:1.6">Your United Bank Offshore account is ready. Your multi-currency wallets (USD, EUR, GBP and ZAR) are available in your console, where you can send transfers, review transactions and manage security settings.</p>
<p style="color:#536174;line-height:1.6">If you have not yet submitted your government ID, please do so from your account so we can complete verification. Our Customer Services chat is available on every page if you need help.</p>${button}`,
    ),
    text: `Welcome to United Bank Offshore, ${name || "valued client"}. Your multi-currency account is ready. Sign in to open your banking console.${appUrl ? ` ${appUrl}/dashboard` : ""}`,
  };
}

export function supportMessageEmail(params: {
  reference: string;
  name: string;
  email: string;
  message: string;
}) {
  const { reference, name, email, message } = params;
  return {
    subject: `[Support ${reference}] Message from ${name}`.slice(0, 150),
    html: layout(
      "New customer-service message",
      `<p style="color:#536174;line-height:1.6"><strong>Reference:</strong> ${escapeHtml(reference)}<br><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}</p>
<p style="background:#f8fafc;border-radius:8px;padding:16px;line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</p>
<p style="color:#718096;font-size:12px">Reply to this email to respond directly to the customer.</p>`,
    ),
    text: `Reference: ${reference}\nName: ${name}\nEmail: ${email}\n\n${message}`,
  };
}
