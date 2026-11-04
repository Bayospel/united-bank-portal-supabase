import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sends the branded welcome email (via Resend) the first time a signed-in client
 * reaches the portal. A flag in the auth user's metadata prevents duplicates.
 */
export const sendWelcomeEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as Record<string, unknown>;
    const email = typeof claims["email"] === "string" ? claims["email"] : null;
    if (!email) return { sent: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, welcomeEmail } = await import("@/lib/email.server");

    const { data } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const meta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
    if (meta["welcome_email_sent"]) return { sent: false };

    // Claim the flag first so concurrent requests cannot send two emails.
    await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      user_metadata: { ...meta, welcome_email_sent: new Date().toISOString() },
    });

    const name = typeof meta["full_name"] === "string" ? meta["full_name"] : "";
    const host = getRequestHeader("host");
    const appUrl = process.env["APP_URL"] ?? (host ? `https://${host}` : null);
    const mail = welcomeEmail(name, appUrl);

    try {
      await sendEmail({ to: email, ...mail });
      return { sent: true };
    } catch (e) {
      // Release the flag so a later visit can retry.
      const { welcome_email_sent: _drop, ...rest } = { ...meta } as Record<string, unknown>;
      await supabaseAdmin.auth.admin.updateUserById(context.userId, { user_metadata: rest });
      console.error("[welcome-email]", e);
      return { sent: false };
    }
  });

const supportSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(200),
  message: z.string().trim().min(5, "Please write a little more").max(2000),
  website: z.string().max(200).optional(), // honeypot — real users never fill this
});

const hits = new Map<string, number[]>();
function tooMany(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 5;
}

/** Public customer-service chat: forwards the message to the support inbox via Resend. */
export const sendSupportMessageFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => supportSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const, reference: "UBO-000000" };

    const ip = (getRequestHeader("x-forwarded-for") ?? "unknown").split(",")[0]!.trim();
    if (tooMany(`ip:${ip}`) || tooMany(`em:${data.email.toLowerCase()}`)) {
      throw new Error("Too many messages. Please wait a few minutes and try again.");
    }

    const to = process.env["SUPPORT_EMAIL"];
    if (!to) throw new Error("Customer services is temporarily unavailable.");

    const { sendEmail, supportMessageEmail } = await import("@/lib/email.server");
    const reference = `UBO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const mail = supportMessageEmail({ reference, ...data });
    await sendEmail({ to, replyTo: data.email, ...mail });
    return { ok: true as const, reference };
  });
